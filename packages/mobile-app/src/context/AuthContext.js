import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':    return { ...state, userInfo: action.payload, loading: false };
    case 'LOGOUT':   return { ...state, userInfo: null, loading: false };
    case 'LOADING':  return { ...state, loading: true };
    case 'DONE':     return { ...state, loading: false };
    default:         return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, { userInfo: null, loading: true });

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('userInfo');
      if (stored) dispatch({ type: 'LOGIN', payload: JSON.parse(stored) });
      else dispatch({ type: 'DONE' });
    } catch {
      dispatch({ type: 'DONE' });
    }
  };

  const login = async (email, password) => {
    dispatch({ type: 'LOADING' });
    const { data } = await authAPI.login({ email, password });
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    dispatch({ type: 'LOGIN', payload: data });
    return data;
  };

  const register = async (userData) => {
    dispatch({ type: 'LOADING' });
    const { data } = await authAPI.register(userData);
    await AsyncStorage.setItem('userInfo', JSON.stringify(data));
    dispatch({ type: 'LOGIN', payload: data });
    return data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userInfo');
    dispatch({ type: 'LOGOUT' });
  };

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

export const useAuth = () => useContext(AuthContext);