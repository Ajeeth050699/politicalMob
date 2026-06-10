import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { weatherAPI, alertsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Poll weather + active alerts for the current user's location.
// Usage: const { weather, alerts, refresh, loading } = useWeatherAlerts();
export function useWeatherAlerts({ pollMs = 10 * 60 * 1000 } = {}) {
  const { userInfo } = useAuth();
  const [weather, setWeather] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const pollTimer = useRef(null);

  const location = useMemo(() => {
    return {
      district: userInfo?.district || userInfo?.districtName || userInfo?.state || undefined,
      ward: userInfo?.ward || userInfo?.thokuthi || undefined,
    };
  }, [userInfo]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [wRes, aRes] = await Promise.all([
        weatherAPI.getCurrent({ district: location.district, ward: location.ward }),
        alertsAPI.getActive({ district: location.district, ward: location.ward }),
      ]);

      // API returns {found, data} for weather
      setWeather(wRes?.data?.data || null);

      // API returns {count, data} for alerts
      const list = aRes?.data?.data;
      setAlerts(Array.isArray(list) ? list : []);
    } catch (e) {
      // Keep last known values on failure
    } finally {
      setLoading(false);
    }
  }, [location.district, location.ward]);

  useEffect(() => {
    // initial load
    refresh();

    // Polling
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(() => {
      refresh();
    }, pollMs);

    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [refresh, pollMs]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { weather, alerts, refresh, loading };
}

