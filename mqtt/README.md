# MQTT – HiveMQ Broker

Dieses Projekt nutzt den öffentlichen **HiveMQ**-Broker für die MQTT-Kommunikation.

## Broker-Verbindungsdaten

| Protokoll         | Host                | Port |
|-------------------|---------------------|------|
| TCP               | broker.hivemq.com   | 1883 |
| WebSocket         | broker.hivemq.com   | 8000 |
| TLS/TCP           | broker.hivemq.com   | 8883 |
| TLS/WebSocket     | broker.hivemq.com   | 8884 |

---

## Config verwenden

Die Verbindungsdaten sind in `config.ts` definiert. Importiere sie in deiner Datei:

```ts
import { MQTT_CONFIG } from "../mqtt/config";

// Beispiel: Broker-URL für normales TCP
const url = MQTT_CONFIG.brokerUrls.tcp;
// → "mqtt://broker.hivemq.com:1883"

// Einzelne Werte
const host = MQTT_CONFIG.host;
const port = MQTT_CONFIG.ports.tcp;
```

---

## MQTT-Bibliothek installieren

Wir empfehlen das npm-Paket [`mqtt`](https://www.npmjs.com/package/mqtt):

```bash
npm install mqtt
```

---

## Beispiel: Publish & Subscribe

```ts
import mqtt from "mqtt";
import { MQTT_CONFIG } from "../mqtt/config";

const client = mqtt.connect(MQTT_CONFIG.brokerUrls.tcp);

client.on("connect", () => {
  console.log("Verbunden mit HiveMQ-Broker");

  // Nachricht publishen
  client.publish("mein/topic", "Hallo Welt!");

  // Topic subscriben
  client.subscribe("mein/topic", (err) => {
    if (!err) console.log("Subscribed auf mein/topic");
  });
});

client.on("message", (topic, message) => {
  console.log(`[${topic}] ${message.toString()}`);
});
```

---

## PSE 2025 Topic Structure

This project uses a hierarchical MQTT topic structure for different features:

### Topic Hierarchy

```
car/
├── supercar/
│   ├── gps              # Super car GPS updates for World Drive
│   │   └── Payload: { lat: number, lng: number, speed: number, heading: number, timestamp: string }
│   └── status           # Super car status
│       └── Payload: { active: boolean, name: string }
│
├── {vehicleId}/
│   ├── gps              # User vehicle GPS location
│   │   └── Payload: { lat: number, lng: number, timestamp: string }
│   ├── fuel             # Fuel level updates
│   │   └── Payload: { level: number, timestamp: string }
│   ├── speed            # Speed updates
│   │   └── Payload: { speed: number, timestamp: string }
│   └── status           # Vehicle status
│       └── Payload: { online: boolean, battery: number, etc }
│
└── configurator/
    ├── control          # Smartphone control input for 3D configurator
    │   └── Payload: { action: string, data: any }
    └── telemetry        # 3D model telemetry
        └── Payload: { position: object, rotation: object, speed: number }
```

---

## Hinweise

- Der HiveMQ-Broker ist **öffentlich** – keine Authentifizierung erforderlich.
- **Keine sensiblen Daten** über diesen Broker senden.
- Für verschlüsselte Verbindungen die TLS-Ports (`8883` / `8884`) verwenden.
