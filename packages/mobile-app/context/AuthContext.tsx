import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('http://10.0.2.2:5001/api/auth/login', { email, password });
      setUser(data);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Failed to login', error);
      throw error;
    }
  };

  const signup = async (name, email, password) => {
    try {
      const { data } = await axios.post('http://10.0.2.2:5001/api/auth/signup', { name, email, password });
      setUser(data);
      await AsyncStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (error) {
      console.error('Failed to signup', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
