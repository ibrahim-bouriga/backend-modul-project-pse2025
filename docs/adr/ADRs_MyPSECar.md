# Architectural Decision Records – MyPSECars / Telemetrie
**Author:** Geunho Kim
## ADR-01: Zwei MQTT-Broker (HiveMQ + Mosquitto)

**Status:** Accepted

**Context:** Das Handy sendet Telemetrie (GPS, Tankstand) per MQTT. Ein rein interner Broker (Mosquitto in Docker) ist vom Mobilnetz aus nicht erreichbar. Gleichzeitig soll das Team einen selbst gehosteten MQTT-Broker für interne Services behalten. Das World-Drive-Feature nutzt ebenfalls den öffentlichen HiveMQ-Broker vom Handy aus.

**Decision:** Das Handy publiziert direkt an HiveMQ (`wss://broker.hivemq.com:8884/mqtt`). Der Service `service-mypsecars` subscribed HiveMQ und republiziert empfangene Nachrichten an den internen Mosquitto-Broker. Topics: `psecars/mypsecars/fuel`, `psecars/mypsecars/position`.

**Alternativen (diskutiert, verworfen):**

- Handy → HTTP → Next.js → Service → Mosquitto — technisch machbar, aber gewünscht war Streaming direkt per MQTT vom Handy
- Handy → Mosquitto über ngrok/WebSocket-Proxy — zusätzlicher Tunnel nötig; mit kostenlosem ngrok-Konto problematisch

**Consequences:** `service-mypsecars` fungiert als Bridge zwischen extern (HiveMQ) und intern (Mosquitto). HiveMQ ist öffentlich und unverschlüsselt nutzbar — nur für Demo-/Prototyp-Daten geeignet. Mosquitto-Republish ist vorbereitet; aktuell subscribed kein interner Consumer darauf.

---

## ADR-02: Dashboard liest REST, nicht Mosquitto

**Status:** Accepted

**Context:** Telemetrie-Daten liegen nach dem Empfang im `service-mypsecars` vor. Das Frontend-Dashboard soll Live-Werte anzeigen. Mosquitto ist als interne Infrastruktur gedacht, nicht als UI-API.

**Decision:** Das Dashboard (`TelemetryPanel`) liest Telemetrie über REST (`GET /api/telemetry`) mit Polling im 3-Sekunden-Takt. Kein MQTT-Subscribe im Browser.

**Consequences:** Der Service bleibt Single Source of Truth (In-Memory-State). Frontend bleibt einfach — kein MQTT-Client, kein WebSocket-Handling im Dashboard. 3-Sekunden-Intervall reicht für Demo-Zwecke. Nachteil: leichte Latenz gegenüber Push. Direkter Mosquitto-Zugriff aus dem Frontend würde die Service-Grenze aufweichen.

---

## ADR-03: In-Memory State für Telemetrie, keine DB

**Status:** Accepted

**Context:** Telemetrie umfasst aktuelle GPS-Position und Tankstand. Es werden keine historischen Verläufe benötigt. Ziel ist ein schneller Prototyp ohne zusätzliches DB-Setup für Live-Daten.

**Decision:** Telemetrie wird ausschließlich im RAM gehalten (`telemetry.service.ts`). Keine Persistierung in Postgres oder Redis.

**Consequences:** Einfache Implementierung, keine Migrationen oder Queries für Telemetrie. Daten gehen bei Service-Neustart verloren. Nicht horizontal skalierbar (jede Instanz hätte eigenen State). Für Production könnte Redis oder Postgres integriert werden.

---

## ADR-04: Demo-Login mit JSON, scoped auf MyPSECar

**Status:** Accepted

**Context:** MyPSECar braucht eine Login-Demo ohne Datenbank-Anbindung. Auth soll nur dieses Feature betreffen, nicht die gesamte App.

**Decision:**

- Benutzer in `MyPSECar/_data/users.json`
- Auth-Routen: `/api/mypsecars/auth/login`, `/api/mypsecars/auth/logout`
- Login-Seite: `/MyPSECar/login`
- Session-Cookie (`session`) scoped auf `path: /MyPSECar`

**Alternativen (verworfen):**

- Middleware mit globalem Redirect — zu viel Aufwand für Demo
- Globales Login unter `/login`
- Benutzer in Postgres

**Consequences:** Schnelle Demo ohne DB. Passwörter liegen im Klartext in JSON — nur für Entwicklung/Demo. Nicht eingeloggt: Hinweis + Anmelden-Link, kein QR-Code, keine Telemetrie. Relevante Dateien: `users.json`, `login/page.tsx`, `LogoutButton.tsx`.

---

## ADR-05: Autobild aus car_models-Service (MinIO)

**Status:** Accepted

**Context:** Nach Login soll das gekaufte Auto mit Bild und Name angezeigt werden. Autodaten existieren bereits im Kollegen-Service `car_models` mit Bildern in MinIO.

**Decision:**

- `users.json` referenziert Autos über numerische `carModelId` (DB-ID)
- Bild und Name kommen von `GET /api/car-models` (`CAR_MODELS_URL`, Default `localhost:4001`)
- Bilder liegen in MinIO

**Consequences:** Single Source of Truth für Autodaten beim `car_models`-Service — keine doppelte Pflege in MyPSECar. Abhängigkeit vom Kollegen-Service und MinIO zur Laufzeit. Dashboard zeigt kein Auto, wenn `car_models` nicht erreichbar ist.