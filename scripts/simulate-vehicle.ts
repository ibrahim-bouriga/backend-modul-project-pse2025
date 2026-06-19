#!/usr/bin/env tsx
/**
 * User Vehicle GPS Simulator
 * Simulates a user's vehicle with GPS, fuel, and speed data via MQTT
 */

import mqtt from 'mqtt';
import { MQTT_CONFIG } from '../mqtt/config.js';

// Local route (around a city)
const LOCAL_ROUTES = {
  berlin: [
    { name: 'Alexanderplatz', lat: 52.5200, lng: 13.4050 },
    { name: 'Brandenburg Gate', lat: 52.5163, lng: 13.3777 },
    { name: 'Potsdamer Platz', lat: 52.5096, lng: 13.3760 },
    { name: 'Checkpoint Charlie', lat: 52.5075, lng: 13.3903 },
    { name: 'East Side Gallery', lat: 52.5058, lng: 13.4394 },
  ],
  paris: [
    { name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945 },
    { name: 'Louvre', lat: 48.8606, lng: 2.3376 },
    { name: 'Notre-Dame', lat: 48.8530, lng: 2.3499 },
    { name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950 },
    { name: 'Sacré-Cœur', lat: 48.8867, lng: 2.3431 },
  ],
};

interface SimulationOptions {
  vehicleId: string;
  route: keyof typeof LOCAL_ROUTES;
  speed: number; // km/h
  updateInterval: number; // milliseconds
  fuelConsumption: number; // liters per 100km
  stepsPerSegment: number;
}

const DEFAULT_OPTIONS: SimulationOptions = {
  vehicleId: 'test-vehicle-001',
  route: 'berlin',
  speed: 50, // 50 km/h city driving
  updateInterval: 2000, // 2 seconds
  fuelConsumption: 8, // 8L/100km
  stepsPerSegment: 30,
};

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
 * Calculate distance between two points (simplified)
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
 * Main simulation function
 */
async function simulateVehicle(options: SimulationOptions = DEFAULT_OPTIONS): Promise<void> {
  const route = LOCAL_ROUTES[options.route];
  
  console.log('🚗 User Vehicle Simulator');
  console.log('=========================');
  console.log(`Vehicle ID: ${options.vehicleId}`);
  console.log(`Route: ${options.route} (${route.length} waypoints)`);
  console.log(`Speed: ${options.speed} km/h`);
  console.log(`Update interval: ${options.updateInterval}ms`);
  console.log(`Fuel consumption: ${options.fuelConsumption}L/100km`);
  console.log('');

  // Connect to MQTT broker
  console.log(`Connecting to ${MQTT_CONFIG.brokerUrls.tcp}...`);
  const client = mqtt.connect(MQTT_CONFIG.brokerUrls.tcp, {
    clientId: `vehicle-simulator-${options.vehicleId}-${Math.random().toString(16).slice(2, 10)}`,
  });

  await new Promise<void>((resolve, reject) => {
    client.on('connect', () => {
      console.log('✓ Connected to MQTT broker');
      console.log('');
      resolve();
    });
    client.on('error', reject);
  });

  let currentWaypointIndex = 0;
  let step = 0;
  let fuelLevel = 100; // Start with full tank
  let totalDistance = 0;

  console.log('Starting simulation...');
  console.log('Press Ctrl+C to stop');
  console.log('');

  // Main simulation loop
  const interval = setInterval(() => {
    const currentWaypoint = route[currentWaypointIndex];
    const nextWaypoint = route[(currentWaypointIndex + 1) % route.length];

    // Calculate current position
    const fraction = step / options.stepsPerSegment;
    const position = interpolate(currentWaypoint, nextWaypoint, fraction);

    // Calculate distance traveled this step
    if (step > 0) {
      const prevFraction = (step - 1) / options.stepsPerSegment;
      const prevPosition = interpolate(currentWaypoint, nextWaypoint, prevFraction);
      const stepDistance = calculateDistance(
        prevPosition.lat,
        prevPosition.lng,
        position.lat,
        position.lng
      );
      totalDistance += stepDistance;

      // Calculate fuel consumption
      const fuelUsed = (stepDistance / 100) * options.fuelConsumption;
      fuelLevel = Math.max(0, fuelLevel - fuelUsed);
    }

    // Add some speed variation (±10 km/h)
    const speedVariation = (Math.random() - 0.5) * 20;
    const currentSpeed = Math.max(0, Math.min(80, options.speed + speedVariation));

    // Publish GPS data
    const gpsPayload = {
      lat: position.lat,
      lng: position.lng,
      timestamp: new Date().toISOString(),
    };
    client.publish(`car/${options.vehicleId}/gps`, JSON.stringify(gpsPayload));

    // Publish fuel data
    const fuelPayload = {
      level: Math.round(fuelLevel * 10) / 10,
      timestamp: new Date().toISOString(),
    };
    client.publish(`car/${options.vehicleId}/fuel`, JSON.stringify(fuelPayload));

    // Publish speed data
    const speedPayload = {
      speed: Math.round(currentSpeed),
      timestamp: new Date().toISOString(),
    };
    client.publish(`car/${options.vehicleId}/speed`, JSON.stringify(speedPayload));

    // Log progress
    if (step === 0) {
      console.log(`📍 Departing ${currentWaypoint.name}`);
    } else if (step === options.stepsPerSegment - 1) {
      console.log(`🏁 Arriving at ${nextWaypoint.name}`);
    }

    console.log(
      `   Position: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)} | ` +
      `Speed: ${Math.round(currentSpeed)} km/h | ` +
      `Fuel: ${fuelLevel.toFixed(1)}% | ` +
      `Distance: ${totalDistance.toFixed(2)} km`
    );

    // Refuel if tank is low
    if (fuelLevel < 10) {
      console.log('⛽ Refueling...');
      fuelLevel = 100;
    }

    // Move to next step
    step++;
    if (step >= options.stepsPerSegment) {
      step = 0;
      currentWaypointIndex = (currentWaypointIndex + 1) % route.length;
      console.log('');
    }
  }, options.updateInterval);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('');
    console.log('Stopping simulation...');
    clearInterval(interval);
    
    // Publish offline status
    client.publish(`car/${options.vehicleId}/status`, JSON.stringify({
      online: false,
      timestamp: new Date().toISOString(),
    }));

    client.end(false, {}, () => {
      console.log('✓ Disconnected from MQTT broker');
      console.log(`Total distance traveled: ${totalDistance.toFixed(2)} km`);
      process.exit(0);
    });
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const options: SimulationOptions = { ...DEFAULT_OPTIONS };

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--vehicle-id':
      options.vehicleId = args[++i];
      break;
    case '--route':
      options.route = args[++i] as keyof typeof LOCAL_ROUTES;
      break;
    case '--speed':
      options.speed = parseInt(args[++i]);
      break;
    case '--interval':
      options.updateInterval = parseInt(args[++i]);
      break;
    case '--fuel-consumption':
      options.fuelConsumption = parseFloat(args[++i]);
      break;
    case '--steps':
      options.stepsPerSegment = parseInt(args[++i]);
      break;
    case '--help':
      console.log('User Vehicle GPS Simulator');
      console.log('');
      console.log('Usage: npm run simulate:vehicle [options]');
      console.log('');
      console.log('Options:');
      console.log('  --vehicle-id <id>    Vehicle ID (default: test-vehicle-001)');
      console.log('  --route <city>       Route: berlin, paris (default: berlin)');
      console.log('  --speed <km/h>       Average speed (default: 50)');
      console.log('  --interval <ms>      Update interval (default: 2000)');
      console.log('  --fuel-consumption <L/100km>  Fuel consumption (default: 8)');
      console.log('  --steps <number>     Steps per segment (default: 30)');
      console.log('  --help               Show this help');
      process.exit(0);
  }
}

// Validate route
if (!LOCAL_ROUTES[options.route]) {
  console.error(`Error: Invalid route "${options.route}"`);
  console.error(`Available routes: ${Object.keys(LOCAL_ROUTES).join(', ')}`);
  process.exit(1);
}

// Start simulation
simulateVehicle(options).catch((error) => {
  console.error('Simulation error:', error);
  process.exit(1);
});
