import mqtt from 'mqtt';
import type { VehicleTelemetry } from '../types';
import { updateLatest, pushToSseClients } from '../services/telemetry-broadcast.service';
import { handleTelemetry } from '../services/trip.service';

// Wildcard: subscribe to all cars
const TOPIC_PATTERN = 'psecars/worlddrive/+/telemetry';
const brokerUrl     = process.env.MQTT_BROKER_URL ?? 'mqtt://broker.hivemq.com:1883';

export function connectMqtt(): void {
  const client = mqtt.connect(brokerUrl, { reconnectPeriod: 5000 });

  client.on('connect', () => {
    console.log(`[MQTT] Connected — subscribing to ${TOPIC_PATTERN}`);
    client.subscribe(TOPIC_PATTERN, (err) => {
      if (err) console.error('[MQTT] Subscribe error:', err.message);
    });
  });

  client.on('message', (topic, payload) => {
    // Extract carId from topic: psecars/worlddrive/{carId}/telemetry
    const parts = topic.split('/');
    if (parts.length !== 4) return;
    const carId = parts[2];

    try {
      const data = JSON.parse(payload.toString()) as unknown;
      if (
        typeof data !== 'object' || data === null ||
        typeof (data as Record<string, unknown>).lat !== 'number' ||
        typeof (data as Record<string, unknown>).lng !== 'number'
      ) {
        return;
      }

      const { lat, lng, speed, timestamp } = data as {
        lat: number; lng: number; speed?: number | null; timestamp?: string;
      };

      const telemetry: VehicleTelemetry = {
        lat,
        lng,
        speed:     typeof speed === 'number' ? speed : null,
        timestamp: timestamp ?? new Date().toISOString(),
      };

      const enriched = updateLatest(carId, telemetry);
      pushToSseClients(carId, enriched);
      handleTelemetry(carId, enriched).catch((err) =>
        console.error(`[Trip] DB error for ${carId}:`, (err as Error).message),
      );
    } catch {
      console.error('[MQTT] Failed to parse message');
    }
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
}
