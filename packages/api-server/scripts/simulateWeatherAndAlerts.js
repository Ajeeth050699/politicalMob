/*
  Weather + Alerts simulator (backend integration scaffolding).
  Replace this with real weather provider fetch later.
*/

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', `.env.${process.env.NODE_ENV || 'development'}`) });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { WeatherSnapshot, WeatherAlert } = require('../src/models/weatherModel');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/politicalMob';
  await mongoose.connect(mongoUri);

  // For now, simulate district+ward combos.
  // Later: read districts/wards from DB.
  const locations = [
    { district: 'Tamil Nadu', ward: 'Ward 1' },
    { district: 'Tamil Nadu', ward: 'Ward 2' },
    { district: 'Chennai', ward: 'Thokuthi 1' },
  ];

  const conditions = [
    { condition: 'Partly Cloudy', temp: [30, 34], precip: [0, 2] },
    { condition: 'Cloudy', temp: [28, 33], precip: [1, 8] },
    { condition: 'Light Rain', temp: [26, 30], precip: [6, 20] },
    { condition: 'Heavy Rain', temp: [24, 29], precip: [20, 70] },
  ];

  for (const loc of locations) {
    const c = pick(conditions);
    const temperatureC = Math.floor(pick([...Array(7)].map(() => pick(c.temp))));
    const precipitationMm = Math.floor(pick([...Array(7)].map(() => pick(c.precip))));

    const snapshot = await WeatherSnapshot.create({
      district: loc.district,
      ward: loc.ward,
      provider: 'simulator',
      temperatureC,
      condition: c.condition,
      precipitationMm,
      raw: { note: 'simulated payload' },
      fetchedAt: new Date(),
    });

    // Alert derivation rules (simple thresholds)
    let alert = null;
    if (precipitationMm >= 40 || c.condition === 'Heavy Rain') {
      alert = {
        severity: 'HIGH',
        alertType: 'HEAVY_RAIN',
        title: 'Heavy rain expected',
        message: 'Heavy rain expected today. Avoid water-logged areas and check drains.',
        ttlMin: 180,
      };
    } else if (precipitationMm >= 12 || c.condition === 'Light Rain') {
      alert = {
        severity: 'MEDIUM',
        alertType: 'RISKY_RAIN',
        title: 'Rain likely',
        message: 'Rain is likely in your area. Stay alert and report drainage issues.',
        ttlMin: 120,
      };
    } else {
      // no active alert for low precip; mark existing alerts inactive
      await WeatherAlert.updateMany(
        { district: loc.district, ward: loc.ward, isActive: true },
        { $set: { isActive: false } }
      );
      continue;
    }

    // upsert active alert per location + type
    await WeatherAlert.updateMany(
      { district: loc.district, ward: loc.ward, alertType: alert.alertType, isActive: true },
      { $set: { expiresAt: new Date(Date.now() + alert.ttlMin * 60 * 1000) } }
    );

    await WeatherAlert.create({
      district: loc.district,
      ward: loc.ward,
      severity: alert.severity,
      alertType: alert.alertType,
      title: alert.title,
      message: alert.message,
      isActive: true,
      expiresAt: new Date(Date.now() + alert.ttlMin * 60 * 1000),
      weatherSnapshotId: snapshot._id,
    });

    // Keep only the most recent active alert per type
    await WeatherAlert.aggregate([
      { $match: { district: loc.district, ward: loc.ward, alertType: alert.alertType, isActive: true } },
      { $sort: { createdAt: -1 } },
    ]);
  }

  console.log('Weather snapshot + alert simulation completed');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

