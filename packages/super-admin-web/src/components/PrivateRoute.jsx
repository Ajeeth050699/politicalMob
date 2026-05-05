import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  return userInfo?.role === 'superadmin' ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
