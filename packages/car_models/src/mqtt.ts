const host = process.env.MQTT_BROKER_HOST ?? 'localhost';
const port = process.env.MQTT_BROKER_PORT ?? '1883';
const wsPort = process.env.MQTT_WS_PORT ?? '9001';

export const MQTT_CONFIG = {
    host,
    ports: {
        tcp: parseInt(port),
        websocket: parseInt(wsPort),
    },
    brokerUrls: {
        tcp: `mqtt://${host}:${port}`,
        websocket: `ws://${host}:${wsPort}/mqtt`,
    },
} as const;
