import mqtt from 'mqtt';
import { updateTelemetry } from '../services/telemetry.service';

const TOPIC = 'psecars/worlddrive/telemetry';

const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://broker.hivemq.com:1883';

export function connectMqtt(): void {
  const client = mqtt.connect(brokerUrl, { reconnectPeriod: 5000 });

  client.on('connect', () => {
    console.log(`[MQTT] Connected to ${brokerUrl}`);
    client.subscribe(TOPIC, (err) => {
      if (err) {
        console.error('[MQTT] Subscribe error:', err.message);
      } else {
        console.log(`[MQTT] Subscribed to ${TOPIC}`);
      }
    });
  });

  client.on('message', (_topic, payload) => {
    try {
      const data = JSON.parse(payload.toString()) as unknown;
      if (
        typeof data === 'object' &&
        data !== null &&
        'lat' in data &&
        'lng' in data &&
        typeof (data as Record<string, unknown>).lat === 'number' &&
        typeof (data as Record<string, unknown>).lng === 'number'
      ) {
        const { lat, lng, speed, timestamp } = data as {
          lat: number;
          lng: number;
          speed?: number | null;
          timestamp?: string;
        };
        updateTelemetry({
          lat,
          lng,
          speed: typeof speed === 'number' ? speed : null,
          timestamp: timestamp ?? new Date().toISOString(),
        });
        console.log(
          `[MQTT] Telemetry: ${lat.toFixed(5)}, ${lng.toFixed(5)} — ${speed != null ? `${(speed * 3.6).toFixed(1)} km/h` : 'speed N/A'}`,
        );
      } else {
        console.warn('[MQTT] Received invalid telemetry payload');
      }
    } catch {
      console.error('[MQTT] Failed to parse message');
    }
  });

  client.on('error', (err) => console.error('[MQTT] Error:', err.message));
  client.on('reconnect', () => console.log('[MQTT] Reconnecting...'));
}
