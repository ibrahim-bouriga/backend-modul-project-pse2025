# Architecture Decision Records — World Drive Service
**Author:** Bennet Göttsche

## ADR-001: Eigenständiger Service mit Database-per-Service-Pattern

| Feld | Inhalt |
|---|---|
| **Beschreibung** | World Drive wird als isoliertes Paket `packages/service-world-drive` mit eigener PostgreSQL-Instanz `postgres-world-drive` betrieben |
| **Kontext** | Das PSECars-Monorepo besteht aus mehreren Features. World Drive hat spezifische Anforderungen (MQTT, GPS, Echtzeit), die nicht in bestehende Services passen. Eine geteilte Datenbank würde Schema-Konflikte zwischen Teams riskieren. |
| **Rationale** | **Database-per-Service-Pattern** : Jeder Service besitzt seine Daten exklusiv. Kein dienstübergreifender Datenbankzugriff. Die zu speichernden Entitäten (Car, Trip, Waypoint) sind **Application Data** — persistent, mit striktem Schema und finaler Geschäftsrelevanz. PostgreSQL als **Relational DBaaS** eignet sich hier, da Foreign-Key-Relationen (Car → Trip → Waypoint), ACID-Garantien und typisierte Abfragen benötigt werden. Gemeinsame Credentials aus globalen Env-Vars vermeiden redundante Konfiguration. |
| **Constraints** | Höherer Ressourcenverbrauch durch separate Datenbankinstanz; Polyglot Persistence erhöht die Betriebskomplexität. |
| **Auswirkung** | Vollständige Datenisolation: kein anderer Service kann das World-Drive-Schema direkt lesen oder verändern, was Schema-Konflikte und unbeabsichtigte Seiteneffekte ausschließt (**Maintainability**). Im Gegenzug erhöhter Betriebsaufwand durch einen zusätzlichen Datenbankcontainer und eigene Backup-/Migrationspflicht. **Scalability**: Service und Datenbank können unabhängig von anderen PSECars-Komponenten skaliert oder ausgetauscht werden. |

---

## ADR-002: MQTT-Architektur — HiveMQ mit Wildcard-Subscription

| Feld | Inhalt |
|---|---|
| **Beschreibung** | GPS-Telemetrie läuft über **MQTT** auf dem öffentlichen HiveMQ-Broker (nicht lokales Mosquitto) mit einer einzelnen Wildcard-Subscription `psecars/worlddrive/+/telemetry`; `carId` wird per `topic.split('/')` zur Laufzeit extrahiert |
| **Kontext** | Smartphones außerhalb des lokalen Netzwerks müssen GPS-Daten publizieren. Mosquitto ist nur innerhalb des Docker-Netzwerks erreichbar. Neue GPS-Fahrzeuge registrieren sich dynamisch zur Laufzeit: ihre Topics sind beim Service-Start unbekannt. |
| **Rationale** | **MQTT** ist ein leichtgewichtiges Publish-Subscribe-Protokoll über TCP — ideal für mobile Clients mit eingeschränkter Bandbreite, da der Message-Overhead minimal ist. Im Gegensatz zu HTTP-Polling oder WebSockets erlaubt MQTT asynchrones Senden ohne offene Verbindung zum Empfänger. HiveMQ ist öffentlich erreichbar: Smartphones können direkt publishen ohne VPN oder Portfreigabe. Eine Wildcard-Subscription skaliert auf beliebig viele Fahrzeuge ohne Neustart. Mosquitto bleibt für interne Service-Kommunikation (service-mypsecars). |
| **Constraints** | Abhängigkeit von externem Dienst; keine Authentifizierung auf dem Public Broker. Topic-Format ist fest im Code verankert. **Scalability**: Wildcard-Subscription skaliert ohne Code-Änderung auf beliebig viele Fahrzeuge. **Availability**: Ausfall des externen HiveMQ-Brokers unterbricht alle GPS-Publishes. |
| **Auswirkung** | Kein eigener Broker-Betrieb nötig: Smartphones können ohne VPN oder Infrastrukturaufwand publizieren (**Deployability**). Im Gegenzug Abhängigkeit von einem externen, nicht kontrollierten Dienst — Verfügbarkeit, Rate-Limits und Datenschutz liegen beim Anbieter (**Availability**, **Security**). Da der Broker öffentlich und nicht authentifiziert ist, muss die Fahrzeugtrennung über UUID-basierte Topics selbst sichergestellt werden. Neue Fahrzeuge können jederzeit ohne Neustart des Services hinzukommen (**Scalability**). |

---

## ADR-003: SSE statt WebSocket als Echtzeit-Transportschicht (inkl. Next.js-Proxy)

| Feld | Inhalt |
|---|---|
| **Beschreibung** | Echtzeit-Telemetrie wird per Server-Sent Events (SSE) vom Backend an das Frontend geliefert; Next.js proxyt den Stream mit einem Undici-Agent (`bodyTimeout: 0`) |
| **Kontext** | Das Frontend benötigt kontinuierliche GPS-Updates. Die Kommunikation ist rein unidirektional: Server → Client. Standard Node.js HTTP-Client bricht SSE-Verbindungen nach ~300 Sekunden ab (`UND_ERR_BODY_TIMEOUT`). |
| **Rationale** | **SSE** (Server-Sent Events) ist ein HTTP-basiertes Streaming-Protokoll: der Server hält eine einzelne HTTP-Verbindung dauerhaft offen und schreibt Datenpakete im Format `data: {JSON}\n\n` in den Response-Body — der Browser empfängt sie über das native `EventSource`-API ohne Bibliothek. Drei Alternativen wurden bewertet: (1) **WebSocket** ist bidirektional (Vollduplex via TCP-Upgrade-Handshake) und erfordert manuelle Reconnect-Logik; für rein unidirektionale GPS-Updates ist der Aufwand nicht gerechtfertigt. (2) **HTTP-Polling** öffnet bei jedem Abruf eine neue Verbindung — gemessene Latenz 1–2 Sekunden, 15+ Requests pro Task; mit SSE sinkt die Latenz auf unter 100 ms bei einer einzigen persistenten Verbindung. (3) **Long-Polling** hält Verbindungen bis zum nächsten Event offen, baut aber danach neu auf (höherer Overhead als SSE). SSE bietet zudem **natives Browser-Reconnect**: bricht die Verbindung ab, verbindet `EventSource` automatisch neu — ohne eigene Reconnect-Logik. `bodyTimeout: 0` auf dem Undici-Proxy-Agent deaktiviert das Body-Timeout für den unbegrenzt laufenden Stream im Next.js App Router; `headersTimeout: 30.000 ms` erkennt hängende Verbindungen beim Aufbau. Ein Heartbeat-Kommentar (`: keep-alive`) alle 30 Sekunden verhindert Proxy-seitige Timeouts. |
| **Constraints** | **Scalability**: Browser-Limit von 6 gleichzeitigen SSE-Verbindungen pro Domain begrenzt gleichzeitig beobachtbare Fahrzeuge. Kein bidirektionaler Kanal möglich. Bei hängendem Backend-Stream läuft die Frontend-Verbindung ebenfalls unbegrenzt. |
| **Auswirkung** | GPS-Updates erreichen den Browser unter 100 ms ohne Polling-Overhead, da die Verbindung dauerhaft offen bleibt (**Performance**). Kein zusätzlicher WebSocket-Server oder Upgrade-Handshake nötig — das Frontend benötigt keine externe Bibliothek, nur die native `EventSource`-API (**Simplicity**). Im Gegenzug ist kein bidirektionaler Kanal möglich; sollten zukünftig Steuerbefehle vom Browser an den Server nötig sein, wäre eine Migration zu WebSocket erforderlich. Der Next.js-Proxy muss explizit mit `bodyTimeout: 0` konfiguriert werden, da sonst die Verbindung nach ~5 Minuten serverseitig abgebrochen wird. |

---

## ADR-004: In-Memory State statt Redis Cache

| Feld | Inhalt |
|---|---|
| **Beschreibung** | Aktueller Fahrzeugzustand (Telemetrie, SSE-Clientsr) wird als JavaScript `Map` im Prozess-Arbeitsspeicher gehalten |
| **Kontext** | Jedes eingehende MQTT-Paket muss sofort an SSE-Clients weitergeleitet werden. Es wurde evaluiert, ob Redis (**Cache as a Service**) als Zwischenschicht sinnvoll ist. |
| **Rationale** | Der Live-Telemetriezustand ist **Session Data**: transient und ohne finale Geschäftsrelevanz — er dient ausschließlich der Weiterleitung an aktive SSE-Clients, nicht der dauerhaften Auswertung. Redis teilt dieselbe Eigenschaft (kein persistenter State by default), bietet aber gegenüber prozesslokalem Memory zusätzlichen Netzwerk-Aufwand und erfordert einen eigenen Container. Der Vorteil von Redis wäre geteilter State über mehrere Service-Instanzen; bei einer Single Instance entfällt dieser Vorteil. In-Process-Memory ist damit die einfachere und schnellere Wahl für dieses Projekt. |
| **Constraints** | State geht bei Service-Neustart verloren — Clients erhalten erst wieder Daten beim nächsten eingehenden MQTT-Paket. **Scalability**: horizontales Scaling erfordert Migration zu Cache as a Service (Redis), da mehrere Instanzen sonst keinen geteilten State haben. |
| **Auswirkung** | Minimale Latenz vom MQTT-Eingang bis zur SSE-Auslieferung, da kein Netzwerk-Roundtrip anfällt (**Performance**). Kein zusätzlicher Infrastrukturcontainer erforderlich, was die Betriebskomplexität gering hält (**Deployability**). Im Gegenzug ist horizontales Scaling ohne Umbau auf einen geteilten Cache nicht möglich (**Scalability**). |

---

## ADR-005: Dynamischer GPS-Fahrzeug-Lifecycle (Registrierung, Benennung, Inaktivität)

| Feld | Inhalt |
|---|---|
| **Beschreibung** | GPS-Clients erhalten beim Scan eines QR-Codes eine eindeutige Car-ID (`gps-{uuid}`) und einen automatisch zugewiesenen Namen (`Car A`–`Car Z`); GPS-Fahrzeuge ohne Update seit 5 Minuten werden aus der Fahrzeugliste ausgeblendet |
| **Kontext** | Mehrere Smartphones sollen gleichzeitig als Fahrzeuge auftreten. Ohne Registrierungslogik würden alle Clients denselben Datensatz überschreiben. Abgemeldete Smartphones sollen nicht dauerhaft in der Liste erscheinen. |
| **Rationale** | Eine dynamische Registrierung per einmaligem HTTP-Aufruf entkoppelt den Identitätsaufbau vom laufenden Datenstrom: Jeder Client erhält eine eigene, eindeutige Identität, ohne dass vorab eine Konfiguration nötig ist. Einzelbuchstaben-Namen (A–Z) sind menschenlesbar und erfordern keine Nutzereingabe. Automatisches Ausblenden nach 5 min statt expliziter De-Registrierung vereinfacht den mobilen Client — ein Smartphone muss sich nicht abmelden. Fahrzeuge werden dabei nicht gelöscht, damit die Trip-History erhalten bleibt; sie werden nur aus der Aktivliste gefiltert. |
| **Constraints** | Maximal 26 gleichzeitige GPS-Fahrzeuge; `GPS_INACTIVE_MS` ist hardcodiert. |
| **Auswirkung** | Der mobile Client ist nach einem einmaligen HTTP-Aufruf vollständig einsatzbereit — keine manuelle Konfiguration, keine Abmeldung nötig (**Usability**). Die Fahrzeugliste bleibt automatisch aktuell, ohne dass der Server explizite Disconnect-Events verarbeiten muss. Im Gegenzug kann ein inaktives Fahrzeug bis zu 5 Minuten in der Liste verbleiben, bevor es ausblendet — was bei sehr kurzem Demo-Einsatz irreführend wirken kann. Die 26-Fahrzeug-Grenze ist eine harte, nicht konfigurierbare Limitierung (**Scalability**). |

---

## ADR-006: Simulator als bewusste technische Schuld mit OSRM-Routenberechnung

| Feld | Inhalt |
|---|---|
| **Beschreibung** | Ein Fahrzeugsimulator (`simulate.ts`) für Car A und Car B wird als technische Schuld deklariert und via `ENABLE_SIMULATOR`-Umgebungsvariable aktiviert; Routen werden über **OSRM (Open Source Routing Machine)** berechnet |
| **Kontext** | Für Demo-Zwecke werden mindestens zwei Fahrzeuge auf der Karte benötigt. Real steht im Projektzeitraum maximal ein GPS-Client zur Verfügung. |
| **Rationale** | Der Simulator ermöglicht eine vollständige Demo mit mehreren Fahrzeugen. Bewusste Deklaration als technische Schuld, da produktiv nicht benötigt. OSRM ist eine Open-Source-Routing-Engine, die auf vorberechneten Straßengraphen (OpenStreetMap-Daten) kürzeste Routen berechnet. Die Integration erfolgt über einen **HTTP-GET-Aufruf** gegen die öffentliche OSRM-Demo-REST-API (`router.project-osrm.org/route/v1/driving/...`), die eine GeoJSON-kompatible Routengeometrie als JSON zurückgibt — klassisches Request-Response-Muster ohne Streaming. Die zurückgegebenen Koordinatenpunkte werden dann schrittweise per **MQTT-Publish** auf dem jeweiligen Fahrzeugtopic als simulierte GPS-Telemetrie gesendet, sodass die Fahrzeuge auf der Karte der echten Straßenführung folgen. `ENABLE_SIMULATOR=false` setzt den Service in Produktionsmodus ohne Code-Änderung. |
| **Constraints** | Simulator-Routen sind deterministisch und wiederholen sich; produktiv wertlos. Abhängigkeit von der öffentlichen OSRM-Demo-API — bei Nichtverfügbarkeit fehlen dem Simulator die Routenpunkte. |
| **Auswirkung** | Demo-Betrieb mit realistischen, straßengebundenen Fahrzeugbewegungen ohne echte GPS-Hardware möglich (**Testability**). Der Simulator ist per Flag vom produktiven Datenpfad getrennt, sodass kein Testcode in Produktion läuft (**Maintainability**). Im Gegenzug Abhängigkeit von der öffentlichen OSRM-Demo-API — fällt diese aus, fehlen die Routenpunkte. Die Routen sind deterministisch und wiederholen sich, was für längere Demos unnatürlich wirkt. Der Simulator erzeugt außerdem reale Trip- und Waypoint-Einträge in der Datenbank, die nach Demo-Läufen manuell bereinigt werden müssen. |

---

## ADR-007: Geschwindigkeitsberechnung — Haversine-Fallback und EMA-Glättung

| Feld | Inhalt |
|---|---|
| **Beschreibung** | Fehlt `speed` im MQTT-Payload, wird die Geschwindigkeit serverseitig per Haversine-Formel (Großkreisdistanz + Zeitdelta) berechnet; das Frontend glättet den Wert per Exponential Moving Average (α = 0,3) |
| **Kontext** | Mobile GPS-APIs liefern `speed` nicht immer. Rohe GPS-Geschwindigkeitswerte schwanken durch Sensor-Jitter stark; das Geschwindigkeits-HUD soll stabile, lesbare Werte zeigen. Der Simulator (ADR-006) publiziert ebenfalls kein `speed`-Feld, da OSRM nur Koordinatenpunkte liefert — der Haversine-Fallback ist damit auch im Simulatorbetrieb die einzige Quelle für Geschwindigkeitswerte. |
| **Rationale** | Haversine berücksichtigt Erdkrümmung (R = 6.371.000 m) — genau über größere Strecken. EMA ist rechengünstig (eine Multiplikation pro Update), reagiert schneller auf echte Änderungen als gleitender Durchschnitt. α = 0,3 empirisch gewählt: gute Balance aus Glättung und Reaktionszeit. |
| **Constraints** | Haversine: kein Wert beim ersten Punkt; Ungenauigkeit bei niedrigen Update-Frequenzen. EMA: Lag bei starker Beschleunigung; α hardcodiert. |
| **Auswirkung** | Das Geschwindigkeits-HUD zeigt unter allen Bedingungen einen Wert — auch wenn das Gerät kein `speed`-Feld liefert oder der Simulator (OSRM) nur Koordinaten bereitstellt (**Reliability**). Die Glättung reduziert wahrnehmbare Sprünge im HUD deutlich, führt jedoch bei starker Beschleunigung zu einem leichten Anzeigelag. Der Rechenaufwand ist vernachlässigbar: EMA benötigt keine Pufferdatenstruktur und läuft in O(1) pro Update (**Performance**). |

---

## ADR-008: Automatische Trip-Erkennung mit direktem Waypoint-Persistenz

| Feld | Inhalt |
|---|---|
| **Beschreibung** | Trips starten automatisch bei Überschreiten von 0,5 km/h und schließen nach 30 Sekunden Inaktivität; jeder Telemetrie-Punkt wird sofort als einzelner `Waypoint`-Datensatz in PostgreSQL geschrieben |
| **Kontext** | Nutzer sollen keine manuellen Start/Stopp-Aktionen ausführen. GPS-Jitter darf keine Phantomtrips erzeugen. Trip-Routen sollen im Frontend vollständig nachvollziehbar sein. |
| **Rationale** | Der 0,5-km/h-Schwellwert schließt GPS-Jitter im Stand aus, ohne echte Langsamfahrt zu unterdrücken. Das 30-Sekunden-Inaktivitätsfenster schützt vor Phantomtrips bei kurzen Verbindungsabrissen. Wegpunkte werden als **Application Data** in der Relational DBaaS persistiert, weil eine rein In-Memory-Haltung die Kernanforderung verfehlen würde: Die vollständige Routengeometrie eines Trips muss nach dessen Abschluss abrufbar und im Frontend nachzeichenbar sein — dafür wird jeder einzelne Koordinatenpunkt benötigt. Eine aggregierte Speicherung (nur Start, Ende, Gesamtdistanz) würde den Streckenverlauf zerstören. Direktes Insert pro Telemetrie-Event (MQTT → DB) ohne zwischengeschalteten Puffer hält die Implementierung einfach und stellt sicher, dass kein Wegpunkt verloren geht, wenn der Service unerwartet abbricht. |
| **Constraints** | **Performance**: hohe Schreiblast bei hoher GPS-Update-Frequenz, da kein Batching; 30 s kann bei hoher Mobilfunk-Latenz zu früh greifen. |
| **Auswirkung** | Trips entstehen und enden automatisch ohne Nutzerinteraktion; die vollständige Routengeometrie ist nach Abschluss sofort in der Datenbank verfügbar und im Frontend nachzeichenbar (**Usability**, **Data Quality**). Direktes Insert ohne Puffer bedeutet, dass kein Wegpunkt verloren geht, wenn der Service unerwartet abbricht (**Reliability**). Im Gegenzug entsteht bei hoher GPS-Update-Frequenz eine hohe Schreiblast auf der Datenbank — bei sehr vielen gleichzeitigen Fahrzeugen könnte Batching nötig werden (**Performance**). |

---

## ADR-009: ngrok-Integration mit Docker Healthcheck für externe Mobile-Erreichbarkeit

| Feld | Inhalt |
|---|---|
| **Beschreibung** | ngrok tunnelt das Frontend nach außen; ein Node.js-basierter Docker Healthcheck auf `/api/health` stellt sicher, dass ngrok erst startet wenn das Frontend bereit ist |
| **Kontext** | Smartphones außerhalb des lokalen Netzwerks müssen `/m/world-drive` erreichen. ngrok startete initial bevor das Frontend ready war, was zu `ERR_NGROK_3200` führte. `wget` steht im Next.js-Docker-Image nicht zur Verfügung. |
| **Rationale** | `depends_on: condition: service_healthy` erzwingt korrekte Startreihenfolge deklarativ ohne Sleep-Hacks. |
| **Constraints** | Healthcheck verlängert initiale Startzeit. **Availability**: `depends_on: service_healthy` verhindert Race Condition — ngrok startet erst wenn das Frontend wirklich bereit ist. **Security**: ngrok Auth-Token muss als Secret in `.env` verwaltet und aus der Versionskontrolle ausgeschlossen werden. |
| **Auswirkung** | Der QR-Code für Smartphones ist garantiert erst dann aktiv, wenn das Frontend tatsächlich erreichbar ist — Race Conditions beim Start werden ausgeschlossen (**Availability**). Der ngrok Auth-Token muss als Secret außerhalb der Versionskontrolle verwaltet werden; ein fehlender oder ungültiger Token blockiert den gesamten Startvorgang (**Security**, **Operability**). Im Gegenzug verlängert sich die initiale Startzeit, da ngrok auf den Healthcheck warten muss. |

---

## ADR-010: Accuracy Gate für Mobile GPS-Publishing (≤ 50 m)

| Feld | Inhalt |
|---|---|
| **Beschreibung** | Die Mobile-Ansicht publiziert GPS-Koordinaten nur dann per MQTT, wenn die Geolocation API eine Genauigkeit von ≤ 50 Metern meldet; bei schlechterem Signal wird die Position lokal angezeigt aber nicht publiziert |
| **Kontext** | In Gebäuden oder bei schlechtem GPS-Empfang liefert die Geolocation API Positionen mit Ungenauigkeiten von hunderten Metern, die die geteilte Karte verfälschen würden. |
| **Rationale** | Nur Positionen mit ausreichender Konfidenz werden an den gemeinsamen MQTT-Broker gesendet. Lokale Anzeige auch bei schlechtem Signal gibt dem Nutzer Feedback ("±120m — waiting for signal…") statt die App einzufrieren. |
| **Constraints** | 50-m-Schwellwert ist hardcodiert; `enableHighAccuracy: true` erhöht den Akkuverbrauch. |
| **Auswirkung** | Die geteilte Karte zeigt ausschließlich Positionen mit ausreichender Konfidenz — fehlerhafte Ausreißer durch Gebäude oder schlechten Empfang verfälschen das Gesamtbild nicht (**Data Quality**). Nutzer erhalten auch bei gesperrtem Publish lokales Positionsfeedback mit Genauigkeitsangabe, statt eine eingefrorene UI zu sehen (**Usability**). Im Gegenzug erhöht `enableHighAccuracy: true` den Akkuverbrauch des Smartphones spürbar; bei dauerhaft schlechtem Signal wird gar keine Position publiziert, was das Fahrzeug auf der gemeinsamen Karte unsichtbar macht. |

---

## ADR-011: Client-Server-Architekturstil als übergeordnetes Architekturmuster

| Feld | Inhalt |
|---|---|
| **Beschreibung** | World Drive folgt dem Client-Server-Architekturstil: ein dedizierter Express.js-Service (Server) stellt REST-Endpunkte und SSE-Streams bereit; Browser-Clients und mobile GPS-Clients konsumieren diese über klar definierte Schnittstellen |
| **Kontext** | Die Wahl eines übergeordneten Architekturstils prägt alle Kommunikationsmuster im System. |
| **Rationale** | Client-Server trennt Zuständigkeiten klar: der Server aggregiert MQTT-Daten, persistiert Trips und validiert Eingaben (GPS Accuracy Gate, Registrierungslogik); Clients sind zustandslos und leichtgewichtig. Der zentrale Server garantiert Authoritative State — eine einzige Wahrheit über alle Fahrzeugpositionen. REST für Request-Response (Fahrzeugliste, Trips) und SSE für Server-Push (Telemetrie) sind natürliche Ausprägungen dieses Stils. |
| **Constraints** | **Scalability**: zentraler Server ist Single Point of Bottleneck — horizontales Scaling erfordert Zustandsmigration (In-Memory → Redis); **Availability**: Serverausfall unterbricht alle Clients gleichzeitig. |
| **Auswirkung** | Frontend und Backend können unabhängig voneinander weiterentwickelt werden, solange die API-Grenze (REST + SSE) stabil bleibt (**Maintainability**). Validierung und Filterlogik liegt zentral im Server — Clients können diese nicht umgehen, was die Angriffsfläche reduziert (**Security**). Im Gegenzug ist der Server ein Single Point of Failure: fällt er aus, verlieren alle Clients gleichzeitig ihre Verbindung und den Echtzeitstatus (**Availability**). Horizontales Scaling erfordert aufgrund des zentralen In-Memory-States einen zusätzlichen Umbauschritt (**Scalability**). |
