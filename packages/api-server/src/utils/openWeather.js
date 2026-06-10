const axios = require('axios');
const { WeatherSnapshot, WeatherAlert } = require('../models/weatherModel');

const CACHE_MINUTES = 30; // How long before we fetch new data
const DEFAULT_CITY = 'Chennai';

async function fetchWeatherForLocation(district) {
  const city = district || DEFAULT_CITY;
  
  // 1. Check if we have recent data in DB
  const thirtyMinsAgo = new Date(Date.now() - CACHE_MINUTES * 60 * 1000);
  const recentSnapshot = await WeatherSnapshot.findOne({
    district: city,
    fetchedAt: { $gte: thirtyMinsAgo }
  }).sort({ fetchedAt: -1 });

  if (recentSnapshot) {
    return recentSnapshot;
  }

  // 2. We don't have recent data, so fetch from OpenWeatherMap
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('OPENWEATHER_API_KEY is not set. Using simulated/cached weather.');
    return await WeatherSnapshot.findOne({ district: city }).sort({ fetchedAt: -1 });
  }

  try {
    // Adding ,IN forces India context. Adjust as needed if international.
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)},IN&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data;

    const temperatureC = data.main.temp;
    const condition = data.weather && data.weather.length > 0 ? data.weather[0].main : 'Unknown';
    const description = data.weather && data.weather.length > 0 ? data.weather[0].description : '';
    const precipitationMm = (data.rain && data.rain['1h']) || (data.snow && data.snow['1h']) || 0;

    // 3. Save to DB
    const snapshot = await WeatherSnapshot.create({
      district: city,
      lat: data.coord.lat,
      lng: data.coord.lon,
      provider: 'openweathermap',
      temperatureC,
      condition: description ? description.charAt(0).toUpperCase() + description.slice(1) : condition,
      precipitationMm,
      raw: data,
    });

    // 4. Check for alerts based on condition
    const severeConditions = ['Thunderstorm', 'Tornado', 'Squall', 'Hurricane', 'Extreme'];
    let alertSeverity = null;
    let alertTitle = '';
    let alertMessage = '';

    if (severeConditions.includes(condition) || precipitationMm > 15) {
      alertSeverity = 'HIGH';
      alertTitle = 'Severe Weather Alert';
      alertMessage = `High risk of ${condition}. Precipitation: ${precipitationMm}mm. Please stay safe.`;
    } else if (precipitationMm > 2) {
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
