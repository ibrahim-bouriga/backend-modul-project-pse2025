#!/usr/bin/env tsx
/**
 * Super Car GPS Simulator
 * Simulates a super car traveling around Europe, publishing GPS data via MQTT
 */

import mqtt from 'mqtt';
import { MQTT_CONFIG } from '../mqtt/config.js';

// European cities route (lat, lng)
const ROUTE = [
  { name: 'Berlin, Germany', lat: 52.52, lng: 13.405 },
  { name: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378 },
  { name: 'Vienna, Austria', lat: 48.2082, lng: 16.3738 },
  { name: 'Munich, Germany', lat: 48.1351, lng: 11.582 },
  { name: 'Zurich, Switzerland', lat: 47.3769, lng: 8.5417 },
  { name: 'Milan, Italy', lat: 45.4642, lng: 9.19 },
  { name: 'Monaco', lat: 43.7384, lng: 7.4246 },
  { name: 'Barcelona, Spain', lat: 41.3874, lng: 2.1686 },
  { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038 },
  { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  { name: 'Brussels, Belgium', lat: 50.8503, lng: 4.3517 },
  { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Hamburg, Germany', lat: 53.5511, lng: 9.9937 },
];

interface SimulationOptions {
  speed: number; // km/h
  updateInterval: number; // milliseconds
  stepsPerSegment: number; // number of steps between cities
}

const DEFAULT_OPTIONS: SimulationOptions = {
  speed: 120, // 120 km/h average
  updateInterval: 3000, // 3 seconds
  stepsPerSegment: 50, // 50 steps between each city
};

/**
 * Calculate distance between two points (Haversine formula)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate heading/bearing between two points
 */
function calculateHeading(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  const heading = Math.atan2(y, x) * 180 / Math.PI;
  return (heading + 360) % 360;
}

/**
 * Interpolate between two points
 */
function interpolate(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  fraction: number
): { lat: number; lng: number } {
  return {
    lat: start.lat + (end.lat - start.lat) * fraction,
    lng: start.lng + (end.lng - start.lng) * fraction,
  };
}

/**
 * Main simulation function
 */
async function simulateSuperCar(options: SimulationOptions = DEFAULT_OPTIONS): Promise<void> {
  console.log('🏎️  PSE Hyperion World Tour Simulator');
  console.log('=====================================');
  console.log(`Speed: ${options.speed} km/h`);
  console.log(`Update interval: ${options.updateInterval}ms`);
  console.log(`Route: ${ROUTE.length} cities`);
  console.log('');

  // Connect to MQTT broker
  console.log(`Connecting to ${MQTT_CONFIG.brokerUrls.tcp}...`);
  const client = mqtt.connect(MQTT_CONFIG.brokerUrls.tcp, {
    clientId: `supercar-simulator-${Math.random().toString(16).slice(2, 10)}`,
  });

  await new Promise<void>((resolve, reject) => {
    client.on('connect', () => {
      console.log('✓ Connected to MQTT broker');
      console.log('');
      resolve();
    });
    client.on('error', reject);
  });

  // Publish initial status
  client.publish('car/supercar/status', JSON.stringify({
    active: true,
    name: 'PSE Hyperion World Tour',
  }));

  let currentCityIndex = 0;
  let step = 0;

  console.log('Starting simulation...');
  console.log('Press Ctrl+C to stop');
  console.log('');

  // Main simulation loop
  const interval = setInterval(() => {
    const currentCity = ROUTE[currentCityIndex];
    const nextCity = ROUTE[(currentCityIndex + 1) % ROUTE.length];

    // Calculate current position
    const fraction = step / options.stepsPerSegment;
    const position = interpolate(currentCity, nextCity, fraction);

    // Calculate heading
    const heading = calculateHeading(
      position.lat,
      position.lng,
      nextCity.lat,
      nextCity.lng
    );

    // Add some speed variation (±20 km/h)
    const speedVariation = (Math.random() - 0.5) * 40;
    const currentSpeed = Math.max(60, Math.min(180, options.speed + speedVariation));

    // Publish GPS data
    const payload = {
      lat: position.lat,
      lng: position.lng,
      speed: currentSpeed,
      heading: Math.round(heading),
      timestamp: new Date().toISOString(),
    };

    client.publish('car/supercar/gps', JSON.stringify(payload));

    // Log progress
    if (step === 0) {
      console.log(`📍 Departing ${currentCity.name}`);
    } else if (step === options.stepsPerSegment - 1) {
      console.log(`🏁 Arriving at ${nextCity.name}`);
    }

    console.log(
      `   Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)} | ` +
      `Speed: ${currentSpeed.toFixed(0)} km/h | ` +
      `Heading: ${Math.round(heading)}°`
    );

    // Move to next step
    step++;
    if (step >= options.stepsPerSegment) {
      step = 0;
      currentCityIndex = (currentCityIndex + 1) % ROUTE.length;
      console.log('');
    }
  }, options.updateInterval);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    console.log('Stopping simulation...');
    clearInterval(interval);
    
    // Publish inactive status
    client.publish('car/supercar/status', JSON.stringify({
      active: false,
      name: 'PSE Hyperion World Tour',
    }));

    client.end(false, {}, () => {
      console.log('✓ Disconnected from MQTT broker');
      process.exit(0);
    });
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SimulationOptions = { ...DEFAULT_OPTIONS };

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--speed':
      options.speed = parseInt(args[++i]);
      break;
    case '--interval':
      options.updateInterval = parseInt(args[++i]);
      break;
    case '--steps':
      options.stepsPerSegment = parseInt(args[++i]);
      break;
    case '--help':
      console.log('Super Car GPS Simulator');
      console.log('');
      console.log('Usage: npm run simulate:supercar [options]');
      console.log('');
      console.log('Options:');
      console.log('  --speed <km/h>       Average speed (default: 120)');
      console.log('  --interval <ms>      Update interval (default: 3000)');
      console.log('  --steps <number>     Steps per segment (default: 50)');
      console.log('  --help               Show this help');
      process.exit(0);
  }
}

// Start simulation
simulateSuperCar(options).catch((error) => {
  console.error('Simulation error:', error);
  process.exit(1);
});
