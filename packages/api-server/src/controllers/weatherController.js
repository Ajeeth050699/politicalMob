const asyncHandler = require('express-async-handler');
const { WeatherSnapshot, WeatherAlert } = require('../models/weatherModel');
const { fetchWeatherForLocation } = require('../utils/openWeather');

// Helper: location fallback logic
function normalizeLocation({ district, ward, lat, lng }) {
  return {
    district: district || undefined,
    ward: ward || undefined,
    lat: lat || undefined,
    lng: lng || undefined,
  };
}

// GET /api/weather/current?district=&ward=&lat=&lng=
// Returns latest weather snapshot for provided location.
const getCurrentWeather = asyncHandler(async (req, res) => {
  const { district, ward, lat, lng } = normalizeLocation(req.query);

  // Fetch real weather using OpenWeather API utility
  // This will read from DB if < 30 mins old, otherwise fetch from OpenWeatherMap
  const doc = await fetchWeatherForLocation(district, lat, lng);

  res.json({
    found: !!doc,
    data: doc || null,
  });
});

// GET /api/alerts/active?district=&ward=
// Returns active alerts for provided location.
const getActiveAlerts = asyncHandler(async (req, res) => {
  const { district, ward } = normalizeLocation(req.query);

  const now = new Date();
  const filter = {
    isActive: true,
    expiresAt: { $gte: now },
  };

  if (district) filter.district = district;
  if (ward) filter.ward = ward;

  // We should also run fetchWeatherForLocation here just in case alerts are requested without weather
  // but it's typically requested together so weather is usually fresh.
  await fetchWeatherForLocation(district);

  // If ward not given, return district-level alerts.
  const alerts = await WeatherAlert.find(filter)
    .sort({ severity: -1, expiresAt: 1 })
    .limit(10)
    .lean();

  res.json({
    count: alerts.length,
    data: alerts,
  });
});

module.exports = {
  getCurrentWeather,
  getActiveAlerts,
};

