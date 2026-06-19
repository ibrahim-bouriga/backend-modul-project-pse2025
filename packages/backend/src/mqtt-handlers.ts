import { prisma } from './db.js';
import {
  SuperCarGPSSchema,
  SuperCarStatusSchema,
  VehicleGPSSchema,
  VehicleFuelSchema,
  VehicleSpeedSchema,
  MQTT_TOPICS,
  MQTTClientWrapper,
  type SuperCarGPS,
  type SuperCarStatus,
  type VehicleGPS,
  type VehicleFuel,
  type VehicleSpeed,
} from './mqtt-client.js';
import { ZodError } from 'zod';

/**
 * Handle Super Car GPS updates
 * Updates the SuperCar table with new location data
 */
async function handleSuperCarGPS(payload: SuperCarGPS): Promise<void> {
  try {
    console.log('[MQTT Handler] Super Car GPS update:', payload);

    // Find the active super car or create one
    const existingSuperCar = await prisma.superCar.findFirst({
      where: { active: true },
    });

    if (existingSuperCar) {
      // Update existing super car
      await prisma.superCar.update({
        where: { id: existingSuperCar.id },
        data: {
          latitude: payload.lat,
          longitude: payload.lng,
          speed: payload.speed,
          heading: payload.heading,
          timestamp: new Date(payload.timestamp),
        },
      });
      console.log(`[MQTT Handler] Updated super car ${existingSuperCar.name}`);
    } else {
      // Create new super car entry
      await prisma.superCar.create({
        data: {
          name: 'PSE Hyperion World Tour',
          latitude: payload.lat,
          longitude: payload.lng,
          speed: payload.speed,
          heading: payload.heading,
          timestamp: new Date(payload.timestamp),
          active: true,
        },
      });
      console.log('[MQTT Handler] Created new super car entry');
    }
  } catch (error) {
    console.error('[MQTT Handler] Error handling super car GPS:', error);
  }
}

/**
 * Handle Super Car status updates
 */
async function handleSuperCarStatus(payload: SuperCarStatus): Promise<void> {
  try {
    console.log('[MQTT Handler] Super Car status update:', payload);

    const existingSuperCar = await prisma.superCar.findFirst({
      where: { name: payload.name },
    });

    if (existingSuperCar) {
      await prisma.superCar.update({
        where: { id: existingSuperCar.id },
        data: {
          active: payload.active,
        },
      });
      console.log(`[MQTT Handler] Updated super car status: ${payload.name}`);
    }
  } catch (error) {
    console.error('[MQTT Handler] Error handling super car status:', error);
  }
}

/**
 * Handle User Vehicle GPS updates
 * Creates a new VehicleStatus entry with GPS data
 */
async function handleVehicleGPS(vehicleId: string, payload: VehicleGPS): Promise<void> {
  try {
    console.log(`[MQTT Handler] Vehicle ${vehicleId} GPS update:`, payload);

    // Check if vehicle exists
    const vehicle = await prisma.userVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      console.warn(`[MQTT Handler] Vehicle ${vehicleId} not found, skipping GPS update`);
      return;
    }

    // Get the latest status to preserve fuel level
    const latestStatus = await prisma.vehicleStatus.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    // Create new status entry with GPS data
    await prisma.vehicleStatus.create({
      data: {
        vehicleId,
        latitude: payload.lat,
        longitude: payload.lng,
        fuelLevel: latestStatus?.fuelLevel ?? 100, // Preserve fuel or default to 100
        speed: null,
        timestamp: new Date(payload.timestamp),
      },
    });

    console.log(`[MQTT Handler] Created GPS status for vehicle ${vehicleId}`);
  } catch (error) {
    console.error(`[MQTT Handler] Error handling vehicle ${vehicleId} GPS:`, error);
  }
}

/**
 * Handle User Vehicle fuel level updates
 * Creates a new VehicleStatus entry with fuel data
 */
async function handleVehicleFuel(vehicleId: string, payload: VehicleFuel): Promise<void> {
  try {
    console.log(`[MQTT Handler] Vehicle ${vehicleId} fuel update:`, payload);

    // Check if vehicle exists
    const vehicle = await prisma.userVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      console.warn(`[MQTT Handler] Vehicle ${vehicleId} not found, skipping fuel update`);
      return;
    }

    // Get the latest status to preserve location
    const latestStatus = await prisma.vehicleStatus.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    // Create new status entry with fuel data
    await prisma.vehicleStatus.create({
      data: {
        vehicleId,
        fuelLevel: payload.level,
        latitude: latestStatus?.latitude ?? 0,
        longitude: latestStatus?.longitude ?? 0,
        speed: latestStatus?.speed,
        timestamp: new Date(payload.timestamp),
      },
    });

    console.log(`[MQTT Handler] Created fuel status for vehicle ${vehicleId}`);
  } catch (error) {
    console.error(`[MQTT Handler] Error handling vehicle ${vehicleId} fuel:`, error);
  }
}

/**
 * Handle User Vehicle speed updates
 * Updates the latest VehicleStatus entry with speed data
 */
async function handleVehicleSpeed(vehicleId: string, payload: VehicleSpeed): Promise<void> {
  try {
    console.log(`[MQTT Handler] Vehicle ${vehicleId} speed update:`, payload);

    // Check if vehicle exists
    const vehicle = await prisma.userVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      console.warn(`[MQTT Handler] Vehicle ${vehicleId} not found, skipping speed update`);
      return;
    }

    // Get the latest status to update
    const latestStatus = await prisma.vehicleStatus.findFirst({
      where: { vehicleId },
      orderBy: { timestamp: 'desc' },
    });

    if (latestStatus) {
      // Update existing status with speed
      await prisma.vehicleStatus.update({
        where: { id: latestStatus.id },
        data: {
          speed: payload.speed,
          timestamp: new Date(payload.timestamp),
        },
      });
      console.log(`[MQTT Handler] Updated speed for vehicle ${vehicleId}`);
    } else {
      // Create new status entry if none exists
      await prisma.vehicleStatus.create({
        data: {
          vehicleId,
          fuelLevel: 100,
          latitude: 0,
          longitude: 0,
          speed: payload.speed,
          timestamp: new Date(payload.timestamp),
        },
      });
      console.log(`[MQTT Handler] Created speed status for vehicle ${vehicleId}`);
    }
  } catch (error) {
    console.error(`[MQTT Handler] Error handling vehicle ${vehicleId} speed:`, error);
  }
}

/**
 * Setup MQTT message handlers
 * Subscribes to all relevant topics and registers handlers
 */
export async function setupMQTTHandlers(mqttClient: MQTTClientWrapper): Promise<void> {
  console.log('[MQTT] Setting up message handlers...');

  // Subscribe to super car topics
  await mqttClient.subscribe(MQTT_TOPICS.SUPERCAR_GPS, async (topic, payload) => {
    try {
      const validated = SuperCarGPSSchema.parse(payload);
      await handleSuperCarGPS(validated);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[MQTT] Invalid super car GPS payload:', error.issues);
      } else {
        console.error('[MQTT] Error processing super car GPS:', error);
      }
    }
  });

  await mqttClient.subscribe(MQTT_TOPICS.SUPERCAR_STATUS, async (topic, payload) => {
    try {
      const validated = SuperCarStatusSchema.parse(payload);
      await handleSuperCarStatus(validated);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[MQTT] Invalid super car status payload:', error.issues);
      } else {
        console.error('[MQTT] Error processing super car status:', error);
      }
    }
  });

  // Subscribe to all vehicle topics using wildcard
  // Pattern: car/+/gps, car/+/fuel, car/+/speed
  await mqttClient.subscribe('car/+/gps', async (topic, payload) => {
    try {
      const vehicleId = topic.split('/')[1];
      if (vehicleId === 'supercar' || vehicleId === 'configurator') return;

      const validated = VehicleGPSSchema.parse(payload);
      await handleVehicleGPS(vehicleId, validated);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[MQTT] Invalid vehicle GPS payload:', error.issues);
      } else {
        console.error('[MQTT] Error processing vehicle GPS:', error);
      }
    }
  });

  await mqttClient.subscribe('car/+/fuel', async (topic, payload) => {
    try {
      const vehicleId = topic.split('/')[1];
      if (vehicleId === 'supercar' || vehicleId === 'configurator') return;

      const validated = VehicleFuelSchema.parse(payload);
      await handleVehicleFuel(vehicleId, validated);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[MQTT] Invalid vehicle fuel payload:', error.issues);
      } else {
        console.error('[MQTT] Error processing vehicle fuel:', error);
      }
    }
  });

  await mqttClient.subscribe('car/+/speed', async (topic, payload) => {
    try {
      const vehicleId = topic.split('/')[1];
      if (vehicleId === 'supercar' || vehicleId === 'configurator') return;

      const validated = VehicleSpeedSchema.parse(payload);
      await handleVehicleSpeed(vehicleId, validated);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('[MQTT] Invalid vehicle speed payload:', error.issues);
      } else {
        console.error('[MQTT] Error processing vehicle speed:', error);
      }
    }
  });

  console.log('[MQTT] Message handlers setup complete');
  console.log('[MQTT] Subscribed to topics:');
  console.log('  - car/supercar/gps');
  console.log('  - car/supercar/status');
  console.log('  - car/+/gps (all vehicles)');
  console.log('  - car/+/fuel (all vehicles)');
  console.log('  - car/+/speed (all vehicles)');
}

// Store the MQTT client instance
let mqttClientInstance: MQTTClientWrapper | null = null;

/**
 * Initialize MQTT client and handlers
 * Call this on server startup
 */
export async function initializeMQTT(): Promise<MQTTClientWrapper> {
  const mqttClient = new MQTTClientWrapper();
  
  try {
    await mqttClient.connect();
    await setupMQTTHandlers(mqttClient);
    mqttClientInstance = mqttClient;
    console.log('[MQTT] Initialization complete');
    return mqttClient;
  } catch (error) {
    console.error('[MQTT] Failed to initialize:', error);
    throw error;
  }
}

/**
 * Get the MQTT client instance
 * Returns null if not initialized
 */
export function getMQTTClient(): MQTTClientWrapper | null {
  return mqttClientInstance;
}
