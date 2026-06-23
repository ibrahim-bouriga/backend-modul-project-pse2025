import mqtt, { MqttClient } from 'mqtt';

// Local Mosquitto broker — for internal services
const LOCAL_URL = `mqtt://${process.env.MQTT_BROKER_HOST ?? 'localhost'}:${process.env.MQTT_BROKER_PORT ?? '1883'}`;

let client: MqttClient | null = null;

export function startLocalPublisher(): void {
  client = mqtt.connect(LOCAL_URL, { reconnectPeriod: 5000 });

  client.on('connect', () => console.log(`[mosquitto] Connected to ${LOCAL_URL}`));
  client.on('error',   (err) => console.error('[mosquitto] Error:', err.message));
  client.on('reconnect', () => console.log('[mosquitto] Reconnecting…'));
}

export function publishToLocal(topic: string, payload: string): void {
  if (client?.connected) {
    client.publish(topic, payload, { qos: 0 });
  }
}