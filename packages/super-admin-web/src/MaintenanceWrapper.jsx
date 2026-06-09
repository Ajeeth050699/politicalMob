import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { API_URL } from './config';

export default function MaintenanceWrapper({ children, portalKey }) {
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    checkMaintenance();
  }, [location.pathname]);

  const checkMaintenance = async () => {
    try {
      if (location.pathname === '/login') {
         setLoading(false);
         return;
      }
      
      let isDev = false;
      try {
        const u = JSON.parse(localStorage.getItem('userInfo'));
        if (u && u.role === 'developer') isDev = true;
      } catch(e) {}

      if (isDev) {
        setLoading(false);
        return;
      }

      const { data } = await axios.get(API_URL + '/api/system/public-settings');
      if (data && data.maintenanceMode && data.maintenanceMode[portalKey]) {
        setMaintenance(true);
        setMessage(data.maintenanceMode.message || 'System is under maintenance. Please try again later.');
      } else {
        setMaintenance(false);
      }
    } catch (err) {
      console.error('Failed to check maintenance status', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  if (maintenance && location.pathname !== '/login') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f4f1ed', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#7B1C1C', marginBottom: '20px', fontSize: '2.5rem' }}>System Maintenance</h1>
        <p style={{ color: '#333', fontSize: '1.2rem', textAlign: 'center', maxWidth: '600px', lineHeight: '1.6' }}>{message}</p>
        <p style={{ marginTop: '40px', color: '#666' }}>Developers can <a href="/login" style={{ color: '#7B1C1C', textDecoration: 'underline' }}>Login here</a> to bypass.</p>
      </div>
    );
  }

  return children;
}
