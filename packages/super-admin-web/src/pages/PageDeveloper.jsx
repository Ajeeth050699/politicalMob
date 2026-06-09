import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const API = API_URL;
const getConfig = () => {
  const u = JSON.parse(localStorage.getItem("userInfo") || "{}");
  return { headers: { Authorization: `Bearer ${u.token}` } };
};

export default function PageDeveloper() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newFlagName, setNewFlagName] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);


  const fetchSettings = async () => {
    try {
      const { data } = await axios.get(API + '/api/developer/settings', getConfig());
      setSettings(data);
    } catch (err) {
      alert("Failed to load developer settings");
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceChange = async (key, value) => {
    try {
      const newMaintenanceMode = { ...settings.maintenanceMode, [key]: value };
      const { data } = await axios.put(API + '/api/developer/settings', { maintenanceMode: newMaintenanceMode }, getConfig());
      setSettings(data);
    } catch (err) {
      alert("Failed to update settings");
    }
  };

  const handleMessageChange = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.put(API + '/api/developer/settings', { maintenanceMode: settings.maintenanceMode }, getConfig());
      setSettings(data);
      alert("Message updated");
    } catch (err) {
      alert("Failed to update message");
    }
  };

  const handleFeatureFlagChange = async (key, value) => { try { const newFeatureFlags = { ...settings.featureFlags, [key]: value }; const { data } = await axios.put(API + '/api/developer/settings', { featureFlags: newFeatureFlags }, getConfig()); setSettings(data); } catch (err) { alert('Failed to update feature flag'); } }; const handleAddFeatureFlag = async (e) => { e.preventDefault(); if (!newFlagName.trim()) return; try { const newFeatureFlags = { ...settings.featureFlags, [newFlagName.trim()]: true }; const { data } = await axios.put(API + '/api/developer/settings', { featureFlags: newFeatureFlags }, getConfig()); setSettings(data); setNewFlagName(''); } catch (err) { alert('Failed to add feature flag'); } }; const handleDeleteFeatureFlag = async (key) => { if (!window.confirm('Delete feature flag ' + key + '?')) return; try { const newFeatureFlags = { ...settings.featureFlags }; delete newFeatureFlags[key]; const { data } = await axios.put(API + '/api/developer/settings', { featureFlags: newFeatureFlags }, getConfig()); setSettings(data); } catch (err) { alert('Failed to delete feature flag'); } }; if (loading) return <div>Loading Developer Settings...</div>;
  if (!settings) return <div>No settings found.</div>;

  return (
    <div style={{ padding: 20, background: '#fff', borderRadius: 12, border: '1px solid #ddd' }}>
      <h2 style={{ marginBottom: 20, color: '#7B1C1C' }}>⚙ Developer Control System</h2>
      <p style={{ marginBottom: 20, color: '#666' }}>Highest Privilege Level: Manage global system availability.</p>

      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 10 }}>Maintenance Mode</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          {['api', 'mobileApp', 'adminPortal', 'superAdminPortal'].map(key => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode[key]} 
                onChange={(e) => handleMaintenanceChange(key, e.target.checked)} 
              />
              <strong>{key}</strong>
            </label>
          ))}
        </div>
      </div>
      

      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 10 }}>Maintenance Message</h3>
        <form onSubmit={handleMessageChange} style={{ display: 'flex', gap: 10 }}>
          <input 
            type="text" 
            value={settings.maintenanceMode.message} 
            onChange={(e) => setSettings({ ...settings, maintenanceMode: { ...settings.maintenanceMode, message: e.target.value } })}
            style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd' }} 
          />
          <button type="submit" style={{ padding: '0 20px', background: '#white', border: '1px solid #7ddd', cursor: 'pointer', borderRadius: 6 }}>Update</button>
        </form>
      </div>

      <div style={{ marginBottom: 30 }}>
        <h3 style={{ marginBottom: 10 }}>Feature Flags</h3>
        <div style={{ display: 'grid', gap: 10, marginBottom: 15 }}>
          {Object.entries(settings.featureFlags || {}).map(([key, value]) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#f9f9f9', padding: 10, borderRadius: 6 }}>
              <input type='checkbox' checked={value} onChange={(e) => handleFeatureFlagChange(key, e.target.checked)} />
              <strong>{key}</strong>
              <button onClick={(e) => { e.preventDefault(); handleDeleteFeatureFlag(key); }} style={{marginLeft:'auto', color:'red', border:'none', background:'none', cursor:'pointer'}}>Remove</button>
            </label>
          ))}
          {Object.keys(settings.featureFlags || {}).length === 0 && <span style={{ color: '#666' }}>No feature flags defined.</span>}
        </div>
        <form onSubmit={handleAddFeatureFlag} style={{ display: 'flex', gap: 10 }}>
          <input type='text' placeholder='New flag name (e.g., enableWorkerDashboard)' value={newFlagName} onChange={(e) => setNewFlagName(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #ddd' }} />
          <button type='submit' style={{ padding: '0 20px', background: '#fff', border: '1px solid #7ddd', cursor: 'pointer', borderRadius: 6 }}>Add Flag</button>
        </form>
      </div>
    </div>
  );
}
