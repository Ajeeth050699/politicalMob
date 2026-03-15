import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Overview from './components/dashboard/Overview';
import Analytics from './components/dashboard/Analytics';
import Settings from './components/dashboard/Settings';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <Routes>
      <Route>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route path="overview" element={<Overview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;


// import { useEffect, useState } from "react";
// import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
// import LandingPage from "./LandingPage";
// import AdminLogin from "./AdminLogin";
// import AdminRegister from "./AdminRegister";
// import AdminForgotPassword from "./AdminForgotPassword";
// import AdminDashboard from "./AdminDashboard";

// // ── Auth helpers ───────────────────────────────────────────────────
// const getUser = () => {
//   try { return JSON.parse(localStorage.getItem("userInfo")); } catch { return null; }
// };

// // ── Protected route — redirect to /login if not logged in ──────────
// function ProtectedRoute({ children }) {
//   const user = getUser();
//   if (!user) return <Navigate to="/login" replace />;
//   return children;
// }

// // ── Public route — redirect to /dashboard if already logged in ─────
// function PublicRoute({ children }) {
//   const user = getUser();
//   if (user) return <Navigate to="/dashboard" replace />;
//   return children;
// }

// export default function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Public pages — redirect to dashboard if logged in */}
//         <Route path="/" element={
//           <PublicRoute><LandingPage /></PublicRoute>
//         } />
//         <Route path="/login" element={
//           <PublicRoute><AdminLogin /></PublicRoute>
//         } />
//         <Route path="/register" element={
//           <PublicRoute><AdminRegister /></PublicRoute>
//         } />
//         <Route path="/forgot-password" element={
//           <PublicRoute><AdminForgotPassword /></PublicRoute>
//         } />

//         {/* Protected — redirect to login if not logged in */}
//         <Route path="/dashboard" element={
//           <ProtectedRoute><AdminDashboard /></ProtectedRoute>
//         } />

//         {/* Catch all */}
//         <Route path="*" element={<Navigate to="/" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }