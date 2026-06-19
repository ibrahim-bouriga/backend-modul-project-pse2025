import mqtt, { MqttClient } from 'mqtt';
import { z, ZodError } from 'zod';
import { MQTT_CONFIG } from './mqtt-config.js';

/**
 * Super Car GPS message schema for World Drive feature
 */
export const SuperCarGPSSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().nonnegative(),
  heading: z.number().min(0).max(360),
  timestamp: z.string().datetime(),
});

/**
 * Super Car status message schema
 */
export const SuperCarStatusSchema = z.object({
  active: z.boolean(),
  name: z.string(),
});

/**
 * User Vehicle GPS message schema for MyPSECar feature
 */
export const VehicleGPSSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  timestamp: z.string().datetime(),
});

/**
 * User Vehicle fuel level message schema
 */
export const VehicleFuelSchema = z.object({
  level: z.number().min(0).max(100),
  timestamp: z.string().datetime(),
});

/**
 * User Vehicle speed message schema
 */
export const VehicleSpeedSchema = z.object({
  speed: z.number().nonnegative(),
  timestamp: z.string().datetime(),
});

/**
 * User Vehicle status message schema
 */
export const VehicleStatusSchema = z.object({
  online: z.boolean(),
  battery: z.number().min(0).max(100).optional(),
  timestamp: z.string().datetime(),
});

/**
 * Configurator control message schema (smartphone input)
 */
export const ConfiguratorControlSchema = z.object({
  action: z.enum(['start', 'stop', 'steer', 'accelerate', 'brake']),
  data: z.any(),
});

/**
 * Configurator telemetry message schema
 */
export const ConfiguratorTelemetrySchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  speed: z.number().nonnegative(),
});

// Type exports for TypeScript
export type SuperCarGPS = z.infer<typeof SuperCarGPSSchema>;
export type SuperCarStatus = z.infer<typeof SuperCarStatusSchema>;
export type VehicleGPS = z.infer<typeof VehicleGPSSchema>;
export type VehicleFuel = z.infer<typeof VehicleFuelSchema>;
export type VehicleSpeed = z.infer<typeof VehicleSpeedSchema>;
export type VehicleStatus = z.infer<typeof VehicleStatusSchema>;
export type ConfiguratorControl = z.infer<typeof ConfiguratorControlSchema>;
export type ConfiguratorTelemetry = z.infer<typeof ConfiguratorTelemetrySchema>;

export const MQTT_TOPICS = {
  // Super Car topics
  SUPERCAR_GPS: 'car/supercar/gps',
  SUPERCAR_STATUS: 'car/supercar/status',
  
  // User Vehicle topics (use with vehicleId)
  VEHICLE_GPS: (vehicleId: string) => `car/${vehicleId}/gps`,
  VEHICLE_FUEL: (vehicleId: string) => `car/${vehicleId}/fuel`,
  VEHICLE_SPEED: (vehicleId: string) => `car/${vehicleId}/speed`,
  VEHICLE_STATUS: (vehicleId: string) => `car/${vehicleId}/status`,
  
  // Configurator topics
  CONFIGURATOR_CONTROL: 'car/configurator/control',
  CONFIGURATOR_TELEMETRY: 'car/configurator/telemetry',
} as const;

// ============================================================================
// MQTT Client Wrapper
// ============================================================================

/**
 * Message handler callback type
 */
export type MessageHandler = (topic: string, payload: any) => void | Promise<void>;

/**
 * MQTT Client Wrapper with pub/sub utilities and message validation
 */
export class MQTTClientWrapper {
  private client: MqttClient | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 5000; // 5 seconds

  /**
   * Connect to MQTT broker
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[MQTT] Connecting to ${MQTT_CONFIG.brokerUrls.tcp}...`);
        
        this.client = mqtt.connect(MQTT_CONFIG.brokerUrls.tcp, {
          clientId: `pse2025-backend-${Math.random().toString(16).slice(2, 10)}`,
          clean: true,
          reconnectPeriod: this.reconnectDelay,
        });

        this.client.on('connect', () => {
          console.log('[MQTT] Connected successfully');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.client.on('error', (error) => {
          console.error('[MQTT] Connection error:', error);
          reject(error);
        });

        this.client.on('reconnect', () => {
          this.reconnectAttempts++;
          console.log(`[MQTT] Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[MQTT] Max reconnection attempts reached');
            this.client?.end(true);
          }
        });

        this.client.on('close', () => {
          console.log('[MQTT] Connection closed');
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

      } catch (error) {
        console.error('[MQTT] Failed to connect:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from MQTT broker
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.end(false, {}, () => {
          console.log('[MQTT] Disconnected');
          this.client = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Check if client is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Subscribe to a topic with optional message handler
   */
  async subscribe(topic: string, handler?: MessageHandler): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.client.subscribe(topic, (error) => {
        if (error) {
          console.error(`[MQTT] Failed to subscribe to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`[MQTT] Subscribed to ${topic}`);
          
          // Register handler if provided
          if (handler) {
            if (!this.messageHandlers.has(topic)) {
              this.messageHandlers.set(topic, []);
            }
            this.messageHandlers.get(topic)!.push(handler);
          }
          
          resolve();
        }
      });
    });
  }

  /**
   * Unsubscribe from a topic
   */
  async unsubscribe(topic: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      this.client.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`[MQTT] Failed to unsubscribe from ${topic}:`, error);
          reject(error);
        } else {
          console.log(`[MQTT] Unsubscribed from ${topic}`);
          this.messageHandlers.delete(topic);
          resolve();
        }
      });
    });
  }

  /**
   * Publish a message to a topic with optional validation
   */
  async publish<T>(
    topic: string,
    payload: T,
    schema?: z.ZodSchema<T>
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      try {
        // Validate payload if schema provided
        if (schema) {
          schema.parse(payload);
        }

        const message = JSON.stringify(payload);
        
        this.client.publish(topic, message, { qos: 1 }, (error) => {
          if (error) {
            console.error(`[MQTT] Failed to publish to ${topic}:`, error);
            reject(error);
          } else {
            console.log(`[MQTT] Published to ${topic}`);
            resolve();
          }
        });
      } catch (error) {
        if (error instanceof ZodError) {
          console.error(`[MQTT] Validation error for ${topic}:`, error.issues);
          reject(new Error(`Invalid message format: ${error.issues.map((e) => e.message).join(', ')}`));
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    const rawMessage = message.toString();

    try {
      const payload = JSON.parse(rawMessage);
      console.log(`[MQTT] Received message on ${topic}`);

      // Call registered handlers for this topic
      const exactHandlers = this.messageHandlers.get(topic) || [];
      const wildcardHandlers = Array.from(this.messageHandlers.entries())
        .filter(([registeredTopic]) => this.matchesTopicFilter(registeredTopic, topic))
        .flatMap(([, handlers]) => handlers);

      const handlers = [...new Set([...exactHandlers, ...wildcardHandlers])];

      for (const handler of handlers) {
        try {
          await handler(topic, payload);
        } catch (error) {
          console.error(`[MQTT] Handler error for ${topic}:`, error);
        }
      }
    } catch (error) {
      console.warn(`[MQTT] Ignoring non-JSON message from ${topic}: ${rawMessage}`);
    }
  }

  private matchesTopicFilter(filter: string, topic: string): boolean {
    if (filter === topic) {
      return true;
    }

    const filterLevels = filter.split('/');
    const topicLevels = topic.split('/');

    for (let index = 0; index < filterLevels.length; index++) {
      const filterLevel = filterLevels[index];
      const topicLevel = topicLevels[index];

      if (filterLevel === '#') {
        return true;
      }

      if (topicLevel === undefined) {
        return false;
      }

      if (filterLevel !== '+' && filterLevel !== topicLevel) {
        return false;
      }
    }

    return filterLevels.length === topicLevels.length;
  }

  /**
   * Register a message handler for a topic (without subscribing)
   */
  onMessage(topic: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, []);
    }
    this.messageHandlers.get(topic)!.push(handler);
  }

  /**
   * Remove a message handler
   */
  offMessage(topic: string, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(topic);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

let mqttClientInstance: MQTTClientWrapper | null = null;

/**
 * Get the singleton MQTT client instance
 */
export function getMQTTClient(): MQTTClientWrapper {
  if (!mqttClientInstance) {
    mqttClientInstance = new MQTTClientWrapper();
  }
  return mqttClientInstance;
}

/**
 * Initialize and connect the MQTT client
 */
export async function initializeMQTT(): Promise<MQTTClientWrapper> {
  const client = getMQTTClient();
  if (!client.isConnected()) {
    await client.connect();
  }
  return client;
}

/**
 * Cleanup MQTT client on shutdown
 */
export async function cleanupMQTT(): Promise<void> {
  if (mqttClientInstance) {
    await mqttClientInstance.disconnect();
    mqttClientInstance = null;
  }
}
