const axios = require('axios');
const { WeatherSnapshot, WeatherAlert } = require('../models/weatherModel');

const CACHE_MINUTES = 30; // How long before we fetch new data
const DEFAULT_CITY = 'Chennai';

async function fetchWeatherForLocation(district, lat, lng) {
  const city = district || DEFAULT_CITY;
  
  // 1. Check if we have recent data in DB
  const thirtyMinsAgo = new Date(Date.now() - CACHE_MINUTES * 60 * 1000);
  let query = { fetchedAt: { $gte: thirtyMinsAgo } };
  
  if (lat && lng) {
    // Basic bounding box for caching lat/lng
    query.lat = { $gte: Number(lat) - 0.1, $lte: Number(lat) + 0.1 };
    query.lng = { $gte: Number(lng) - 0.1, $lte: Number(lng) + 0.1 };
  } else {
    query.district = city;
  }

  const recentSnapshot = await WeatherSnapshot.findOne(query).sort({ fetchedAt: -1 });

  if (recentSnapshot?.raw?.current_weather && recentSnapshot?.raw?.daily?.time) {
    return recentSnapshot;
  }

  // 2. We don't have recent data, so fetch from Open-Meteo
  try {
    let targetLat = lat;
    let targetLng = lng;

    if (!targetLat || !targetLng) {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await axios.get(geoUrl);
      if (geoRes.data && geoRes.data.results && geoRes.data.results.length > 0) {
        targetLat = geoRes.data.results[0].latitude;
        targetLng = geoRes.data.results[0].longitude;
      } else {
        throw new Error(`Location not found for ${city}`);
      }
    }

    const weatherParams = new URLSearchParams({
      latitude: String(targetLat),
      longitude: String(targetLng),
      current_weather: 'true',
      hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,precipitation_probability,visibility,uv_index',
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max,uv_index_max',
      timezone: 'auto',
      forecast_days: '7',
    });
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?${weatherParams.toString()}`;
    const response = await axios.get(weatherUrl);
    const data = response.data;

    const current = data.current_weather;
    const temperatureC = current.temperature;
    
    // Convert WMO code to condition string
    const WEATHER_CODE = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Rime fog", 51: "Light drizzle", 53: "Drizzle",
      55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain",
      71: "Light snow", 73: "Snow", 75: "Heavy snow", 80: "Rain showers",
      81: "Showers", 82: "Heavy showers", 95: "Thunderstorm", 96: "Storm with hail", 99: "Severe storm",
    };
    const condition = WEATHER_CODE[current.weathercode] || 'Unknown';
    const precipitationMm = data.hourly && data.hourly.precipitation_probability ? data.hourly.precipitation_probability[0] : 0; // fallback to prob as mm proxy

    // 3. Save to DB
    const snapshot = await WeatherSnapshot.create({
      district: city,
      lat: targetLat,
      lng: targetLng,
      provider: 'open-meteo',
      temperatureC,
      condition,
      precipitationMm,
      raw: data,
    });

    // 4. Check for alerts based on condition
    const severeCodes = [65, 75, 82, 95, 96, 99];
    const rainCodes = [51, 53, 55, 61, 63, 80, 81];
    
    let alertSeverity = null;
    let alertTitle = '';
    let alertMessage = '';

    if (severeCodes.includes(current.weathercode) || precipitationMm > 50) {
      alertSeverity = 'HIGH';
      alertTitle = 'Severe Weather Alert';
      alertMessage = `High risk of ${condition}. Please stay safe.`;
    } else if (rainCodes.includes(current.weathercode) || precipitationMm > 20) {
      alertSeverity = 'MEDIUM';
      alertTitle = 'Rain Alert';
      alertMessage = `Moderate rain expected. Drive carefully.`;
    } else if (temperatureC > 38) {
      alertSeverity = 'HIGH';
      alertTitle = 'Heat Wave Alert';
      alertMessage = `Extreme temperatures (${Math.round(temperatureC)}°C). Stay hydrated.`;
    }

    if (alertSeverity) {
      const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // Valid for 3 hours
      
      // Upsert alert so we don't spam duplicate active alerts
      await WeatherAlert.findOneAndUpdate(
        { 
          district: city, 
          title: alertTitle, 
          isActive: true 
        },
        {
          severity: alertSeverity,
          alertType: 'WEATHER',
          message: alertMessage,
          expiresAt,
          weatherSnapshotId: snapshot._id,
        },
        { upsert: true, new: true }
      );
    }

    return snapshot;
  } catch (error) {
    console.error(`Error fetching real weather for ${city}:`, error.message);
    return await WeatherSnapshot.findOne({ district: city }).sort({ fetchedAt: -1 });
  }
}

module.exports = { fetchWeatherForLocation };
