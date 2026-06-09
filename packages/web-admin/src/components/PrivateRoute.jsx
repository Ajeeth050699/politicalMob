import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  let userInfo = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
  } catch {
    localStorage.removeItem('userInfo');
  }
  return ['admin', 'superadmin'].includes(userInfo?.role) ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
