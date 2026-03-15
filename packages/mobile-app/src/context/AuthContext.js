import React, {
  createContext, useContext, useReducer,
  useEffect, useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { authAPI } from '../services/api';

// ── Session config ─────────────────────────────────────────────────
// Auto-logout after 8 minutes in background / app closed
const SESSION_TIMEOUT_MS = 8 * 60 * 1000;

// ── Reducer ────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':   return { ...state, userInfo: action.payload, loading: false };
    case 'LOGOUT':  return { ...state, userInfo: null,           loading: false };
    case 'LOADING': return { ...state, loading: true  };
    case 'DONE':    return { ...state, loading: false };
    default:        return state;
  }
};

// ── Context ────────────────────────────────────────────────────────
const AuthContext = createContext(undefined);

// ── Provider ───────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { userInfo: null, loading: true });

  const bgTimeRef    = useRef(null);
  const appStateRef  = useRef(AppState.currentState);
  const userInfoRef  = useRef(null);

  // Keep ref in sync with latest userInfo
  useEffect(() => {
    userInfoRef.current = state.userInfo;
  }, [state.userInfo]);

  // ── Load saved user on mount ───────────────────────────────────
  useEffect(() => { loadUser(); }, []);

  // ── AppState listener for background timeout ───────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  const handleAppStateChange = async (nextState) => {
    const prevState = appStateRef.current;
    appStateRef.current = nextState;

    // App going to background
    if (prevState === 'active' && (nextState === 'background' || nextState === 'inactive')) {
      const now = Date.now();
      bgTimeRef.current = now;
      try { await AsyncStorage.setItem('bgTime', String(now)); } catch {}
    }

    // App returning to foreground
    if ((prevState === 'background' || prevState === 'inactive') && nextState === 'active') {
      if (!userInfoRef.current) return; // not logged in

      const bgTime = bgTimeRef.current
        || Number(await AsyncStorage.getItem('bgTime') || '0');
      const elapsed = bgTime ? Date.now() - bgTime : 0;

      if (elapsed >= SESSION_TIMEOUT_MS) {
        // Been away too long — auto logout
        await performLogout();
      } else {
        try { await AsyncStorage.removeItem('bgTime'); } catch {}
        bgTimeRef.current = null;
      }
    }
  };

  // ── Load user ──────────────────────────────────────────────────
  const loadUser = async () => {
    try {
      const [stored, bgTimeStr] = await Promise.all([
        AsyncStorage.getItem('userInfo'),
        AsyncStorage.getItem('bgTime'),
      ]);

      if (!stored) { dispatch({ type: 'DONE' }); return; }

      // Check if session expired while app was closed
      if (bgTimeStr) {
        const elapsed = Date.now() - parseInt(bgTimeStr, 10);
        if (elapsed >= SESSION_TIMEOUT_MS) {
          await AsyncStorage.multiRemove(['userInfo', 'bgTime']);
          dispatch({ type: 'DONE' });
          return;
        }
        await AsyncStorage.removeItem('bgTime');
      }

      dispatch({ type: 'LOGIN', payload: JSON.parse(stored) });
    } catch {
      dispatch({ type: 'DONE' });
    }
  };

  // ── Auth actions ───────────────────────────────────────────────
  const performLogout = async () => {
    await AsyncStorage.multiRemove(['userInfo', 'bgTime']);
    bgTimeRef.current = null;
    dispatch({ type: 'LOGOUT' });
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    dispatch({ type: 'LOGIN', payload: data });
    return data;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    dispatch({ type: 'LOGIN', payload: data });
    return data;
  };

  const logout = performLogout;

  const updateProfile = async (profileData) => {
    const { data } = await authAPI.updateProfile(profileData);
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    dispatch({ type: 'LOGIN', payload: data });
    return data;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};