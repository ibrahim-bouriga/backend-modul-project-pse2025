# MQTT – Mosquitto Broker

This project runs a local **Mosquitto** broker via Docker. The backend connects to it automatically using environment variables.

## Connection details

| Protocol  | Host (Docker)  | Port |
|-----------|----------------|------|
| TCP       | mosquitto      | 1883 |
| WebSocket | mosquitto      | 9001 |

When developing locally (outside Docker), use `localhost` instead of `mosquitto`.

## Using the config

Import the config from `src/mqtt.ts`:

```ts
import { MQTT_CONFIG } from './mqtt';

const url = MQTT_CONFIG.brokerUrls.tcp;
// → "mqtt://mosquitto:1883"

const host = MQTT_CONFIG.host;
const port = MQTT_CONFIG.ports.tcp;
```

The values are driven by env vars — set in `.env` and passed through `docker-compose.yml`:

| Variable           | Default     |
|--------------------|-------------|
| `MQTT_BROKER_HOST` | `localhost` |
| `MQTT_BROKER_PORT` | `1883`      |
| `MQTT_WS_PORT`     | `9001`      |

## Install the MQTT client library

```sh
npm install mqtt
```

## Publish & Subscribe example

```ts
import mqtt from 'mqtt';
import { MQTT_CONFIG } from './mqtt';

const client = mqtt.connect(MQTT_CONFIG.brokerUrls.tcp);

client.on('connect', () => {
    console.log('Connected to Mosquitto broker');

    client.publish('my/topic', 'Hello World!');

    client.subscribe('my/topic', (err) => {
        if (!err) console.log('Subscribed to my/topic');
    });
});

client.on('message', (topic, message) => {
    console.log(`[${topic}] ${message.toString()}`);
});
```

## Topic convention

Use the following naming scheme to avoid conflicts between teams:

```
<project>/<team>/<function>
```

**Examples:**
- `pse2025/teamA/sensor-data`
- `pse2025/teamB/status`
- `pse2025/shared/events`

## Notes

- The Mosquitto broker runs locally — do not send sensitive data without enabling TLS.
- Authentication is disabled by default. See `mosquitto/mosquitto.conf` to enable it.
- Start the broker with `docker compose --profile dev up -d`.
