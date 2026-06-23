import mqtt from 'mqtt';
import { updateFuel, updatePosition } from '../services/telemetry.service';
import { publishToLocal } from './local-publisher';

// Public HiveMQ broker — phone connects here directly
const HIVEMQ_URL = process.env.HIVEMQ_URL ?? 'mqtt://broker.hivemq.com:1883';
const TOPIC      = 'psecars/mypsecars/#';

export function startHiveMqSubscriber(): void {
  const client = mqtt.connect(HIVEMQ_URL, { reconnectPeriod: 5000 });

  client.on('connect', () => {
    console.log(`[hivemq] Connected to ${HIVEMQ_URL}`);
    client.subscribe(TOPIC, (err) => {
      if (err) console.error('[hivemq] Subscribe error:', err.message);
      else console.log(`[hivemq] Subscribed to ${TOPIC}`);
    });
  });

  client.on('message', (topic, payload) => {
    const raw = payload.toString();
    console.log(`[hivemq] ${topic}: ${raw}`);

    if (topic.endsWith('/fuel')) {
      const value = parseFloat(raw);
      if (!isNaN(value)) {
        updateFuel(value);
        publishToLocal(topic, raw);
      }
    }

    if (topic.endsWith('/position')) {
      try {
        const { lat, lng } = JSON.parse(raw) as { lat: number; lng: number };
        if (typeof lat === 'number' && typeof lng === 'number') {
          updatePosition(lat, lng);
          publishToLocal(topic, raw);
        }
      } catch {
        console.warn('[hivemq] Invalid position payload:', raw);
      }
    }
  });

  client.on('error', (err) => console.error('[hivemq] Error:', err.message));
  client.on('reconnect', () => console.log('[hivemq] Reconnecting…'));
}
