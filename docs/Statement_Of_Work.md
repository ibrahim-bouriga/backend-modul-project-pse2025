# Statement of Work „PSECars"

**Modul:** Backend-Entwicklung\
**Knowledge Foundation – Reutlingen University**\
**Abgabedatum:** 25.06.2026

## Kontributor:innen

- Iyad Elwy
- Mariam Azouka
- Jan Baumann
- Phillip Pruessner
- Ibrahim Bouriga
- Geunho Kim
- Bennet Göttsche

---

## Iyad Elwy

- Designed `docker-compose.yml` with dev/prod profiles orchestrating 10+ services (PostgreSQL, MinIO, Redis, Mosquitto, ngrok, and all microservices), volumes, and `.env.example`
- Wrote multi-stage Dockerfiles for all packages
- Configured Mosquitto (TCP + WebSocket), MinIO with public-read bucket, and ngrok as a containerized public tunnel
- Built the `car_models` microservice: Prisma schema, `GET /api/car-models` endpoint, MinIO image storage, and idempotent seed with 6 Lamborghini models
- Established backend as a documented microservice template with pre-wired database, MinIO, and MQTT, Prisma, Dockerfile, env file, `db.ts`, `minio.ts`, `mqtt.ts`
- Built the `/car-overview` Next.js page: server-side data fetch from the car_models API, responsive card grid with category badges, specs, and MinIO images

---

## Mariam Azouka

- Datenmodellschema für Merchandise (`Webshop/prisma/seed.prisma`)
- Beispieldaten für Merchandise (`Webshop/src/prisma/schema.prisma`)
- Setup Redis (`webshop/docker-compose.yml`)
- Data Access mittels `webshop/db.ts`
- API & Middleware: `webshop/src/middleware/session.ts` & `webshop/src/routes/categories.ts` & `products.ts` & `webshop/src/index.ts`
- Frontend für Merchandise-Webshop:
  - `Frontend/app/components/` AddToCart & CartButton & CartDrawer & CartProvider & FilterBar
  - `Frontend/app/feature/merchandise`
  - `Frontend/app/public/products`
- ADRs & Architekturdiagramm zum Merchandise-Webshop-Microservice

---

## Jan Baumann

- Konzeption und Umsetzung einer interaktiven 3D-Fahrsimulation in Ego-Perspektive mit Three.js, inklusive prozeduraler Streckengenerierung, Fahrzeugphysik und Cockpit-Innenraum
- Fahrzeugphysik mit Zielgeschwindigkeits-Modell (Beschleunigung/Verzögerung Richtung proportionaler Zielgeschwindigkeit) und geschwindigkeitsabhängiger Lenkung
- Integration eines externen Sketchfab-GLTF-Modells als Cockpit-Innenraum, inklusive Rückführung einer versteckten Eltern-Transformation und empirisch verifizierter Achskorrekturen für die Lenkrad-Animation
- Smartphone-Fernsteuerung über MQTT (HiveMQ Public Broker): UUID-basierte Session-Isolation, Normalisierung der Gyroskop-Daten zu Steuerungswerten mit Kalibrierung, Watchdog-basierte Verbindungsabbruch-Erkennung und automatischer Tastatur-Fallback
- Behebung eines Tunnel-URL-Auflösungsproblems für lokale Netzwerk-Demos über eine serverseitige Next.js API-Route, sowie Debugging eines WebGL-Render-Target-Feedback-Loops mittels Three.js-Render-Layern
- Teilnahme an Diskussionen & Evaluationen der Gesamtarchitektur und Integrationen (Tunnel-Architektur, Projektstruktur, …)

---

## Phillip Pruessner

- Entwicklung des interaktiven 3D-Fahrzeugkonfigurators mit eigenem Komponentensystem (CarViewer3D, ConfigPanel, PriceCalculator) und Integration eines GLTF-Modells mit PBR-Texturen
- Konzeption und Umsetzung des seitenübergreifenden Routings zwischen Fahrzeugkonfigurator und 3D-Fahrsimulator
- Initiales Aufsetzen der Next.js-Frontend-Architektur sowie Design und Implementierung der Startseite
- Konzeption und Aufsetzen der gesamten Next.js-Feature-Routing-Architektur als gemeinsame Basis für alle Teamfeatures
- Performance-Optimierung des Next.js-Frontends durch clientseitiges Caching und den gezielten Einsatz von React Suspense
- Erstellung von Shell-Skripten zur Einrichtung der lokalen Entwicklungsumgebung und initialen Datenbankinitialisierung
- Erweiterung des 3D-Fahrsimulators um GLTF-basierte Baummodelle mit prozedural zufälliger Streuung in der Umgebung

---

## Ibrahim Bouriga

- **Frontend & Architektur:** Komponentenbasierte, modulare Struktur mit klarer Trennung der Verantwortlichkeiten, TypeScript Interfaces für Typensicherheit, Next.js Image Komponente mit automatischer Bildoptimierung
- **Komponenten:** HeroSection als Vollbild Hero mit optimiertem Hintergrundbild, FeatureGrid, FeatureCard, Section als wiederverwendbarer Wrapper mit Varianten
- **Daten & Konfiguration:** Zentrale Feature Konfiguration in `_lib/constants/features.ts`, Typdefinitionen in `_types/features.ts`, vollständig konfigurationsgetriebene Erweiterbarkeit
- **UI & Experience:** Priorisierte und responsive Hero Bildoptimierung, dunkles Theme mit sanften Farbverläufen
- **Repository & Workflow:** GitHub Repository mit sauberer Versionsverwaltung, geschützter main Branch und PR Review Prozess, Feature Branches sauber in main gemergt
- **API Dokumentation:** OpenAPI 3.0 Dokumentationsdateien für webshop (Health, Produkte, Kategorien, Warenkorb, Bestellungen), car_models (Fahrzeugmodelle, Health) und service mypscars (Telemetrie, Health) erstellt, Swagger UI in allen drei Services unter dem `/api-docs` Endpoint integriert

---

## Geunho Kim

- Implementierung des MyPSECar-Features als eigenständiges Servicepaket
- Ziel: Echtzeit-Erfassung und -Visualisierung von Fahrzeugtelemetrie (GPS & Kraftstoffstand) vom Smartphone auf einem persönlichen Dashboard, verknüpft per QR-Code
- Technologiebasis: Express.js, MQTT (HiveMQ & Mosquitto), Next.js, ngrok
- Backend-Microservice mit MQTT-Integration, In-Memory-State und REST-API
- Authentifiziertes Dashboard mit Echtzeit-Telemetrieanzeige, Fahrzeugbild aus car_models-API und QR-Code-Verlinkung
- Mobile Smartphone-Seite zum Publizieren von GPS und Kraftstoffstand per MQTT
- Docker-Integration inkl. ngrok-Anbindung für externen Smartphone-Zugriff

---

## Bennet Göttsche

**World Drive-Feature:** Implementierung als eigenständiges Servicepaket (`packages/service-world-drive`) im PSECars-Monorepo.

**Tech Stack:** Express.js, Prisma ORM, PostgreSQL, MQTT (HiveMQ), React-Leaflet, OSRM API

- **Service & Datenbank:** Express.js-Paket mit Prisma ORM aufgesetzt; dedizierte PostgreSQL-Instanz `postgres-world-drive` isoliert bereitgestellt; Datenbankschema Car (`source: simulator/gps`) + Trip modelliert
- **MQTT:** HiveMQ-Broker angebunden mit einer Wildcard-Subscription `psecars/worlddrive/+/telemetry` implementiert
- **Echtzeit-Datenverteilung:** Telemetrie-Push via SSE realisiert; In-Memory-State-Management umgesetzt; Geschwindigkeitsberechnung via Haversine-Formel implementiert
- **Frontend:** Interaktive React-Leaflet-Karte entwickelt und integrriert mit Live-Positionen, farbigen Routen, Fahrzeugauswahl und Geschwindigkeits-HUD
- **Fahrzeugregistrierung:** Dynamischer Registrierungsflow umgesetzt (QR-Code-Scan → Farbauswahl → `POST /register` → eindeutige Car-ID + MQTT-Topic); automatisches Ausblenden inaktiver GPS-Fahrzeuge nach 5 min implementiert
- **Mobile:** Mobile-Ansicht `/m/world-drive` für GPS-Publishing via Geolocation API entwickelt
- **Infrastruktur:** ngrok-Integration eingerichtet; Docker-Healthcheck für korrekte Startreihenfolge konfiguriert
- **Simulator:** `simulate.ts` zur Simulation von Autobewegungen implementiert; Routenberechnung über OSRM API integriert als Sicherstellung der Nutzung der Straßen
- **Architektur:** Gesamtarchitektur-Diskussionen mitgestaltet (Tunnel-Architektur, Projektstruktur); Architekturentscheidungen für World Drive erarbeitet und evaluiert (siehe ADRs)