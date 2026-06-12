import React, {
  createContext, useContext, useReducer,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':   return { ...state, userInfo: action.payload, loading: false };
    case 'LOGOUT':  return { ...state, userInfo: null,           loading: false };
    case 'LOADING': return { ...state, loading: true  };
    case 'DONE':    return { ...state, loading: false };
    default:        return state;
  }
};

// Context
const AuthContext = createContext(undefined);

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { userInfo: null, loading: true });

  // Load saved user on mount. Do not expire local login automatically.
  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userInfo');

      if (!stored) { dispatch({ type: 'DONE' }); return; }

      dispatch({ type: 'LOGIN', payload: JSON.parse(stored) });
    } catch {
      dispatch({ type: 'DONE' });
    }
  };

  // Manual logout only. ProfileScreen calls this from the Logout button.
  const performLogout = async () => {
    dispatch({ type: 'LOGOUT' });

    try {
      await AsyncStorage.removeItem('userInfo');
    } catch {
      try {
        await AsyncStorage.removeItem('userInfo');
      } catch {}
    }
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
