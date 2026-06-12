import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
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
  const isRefreshingRef = useRef(false);


  const location = useMemo(() => {
    return {
      district: userInfo?.district || userInfo?.districtName || userInfo?.state || undefined,
      ward: userInfo?.ward || userInfo?.thokuthi || undefined,
    };
  }, [userInfo]);


  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setLoading(true);
    try {

      let lat, lng;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getLastKnownPositionAsync();
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest });
          }
          if (loc) {
            lat = loc.coords.latitude;
            lng = loc.coords.longitude;
          }
        }
      } catch (err) {
        // Location failed, fallback to profile info
      }

      if (!location?.district && !location?.ward) {
        // If user has no location context yet, don't call weather APIs.
        return;
      }

      // reset loading state if we early-return
      setLoading(false);



      const params = {
        district: location.district,
        ward: location.ward,
        lat: typeof lat === 'number' ? lat : undefined,
        lng: typeof lng === 'number' ? lng : undefined,
      };

      // Avoid calling with completely empty parameters.
      if (!params.district && !params.ward && params.lat == null && params.lng == null) {
        return;
      }



      const [wRes, aRes] = await Promise.all([
        weatherAPI.getCurrent(params),
        alertsAPI.getActive(params),
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

