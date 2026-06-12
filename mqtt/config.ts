export const MQTT_CONFIG = {
  host: "broker.hivemq.com",

  ports: {
    tcp: 1883,
    websocket: 8000,
    tlsTcp: 8883,
    tlsWebsocket: 8884,
  },

  brokerUrls: {
    tcp: "mqtt://broker.hivemq.com:1883",
    websocket: "ws://broker.hivemq.com:8000/mqtt",
    tlsTcp: "mqtts://broker.hivemq.com:8883",
    tlsWebsocket: "wss://broker.hivemq.com:8884/mqtt",
  },
} as const;
