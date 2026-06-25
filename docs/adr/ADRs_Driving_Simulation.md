# Architectural Decision Records – Driving Simulation
**Author:** Jan Baumann / Philip Pruessner
## ADR-D1: MQTT statt eigener WebSocket-Implementierung für Smartphone-Steuerung

**Status:** Accepted

**Context:** Die Fahrsimulation soll per Smartphone-Gyroskop steuerbar sein. Browser (Desktop) und Smartphone-Browser müssen Sensordaten in nahezu Echtzeit austauschen, ohne dass beide Geräte sich direkt kennen oder im selben lokalen Netz eine direkte Verbindung aufbauen müssen.

**Decision:** Nutzung von MQTT über einen öffentlichen Broker (HiveMQ, WebSocket-Transport) als Publish/Subscribe-Vermittler zwischen den beiden Browser-Sessions, statt eine eigene WebSocket-Server-Komponente zu implementieren.

**Consequences:** Kein eigener Server-Prozess für Echtzeitkommunikation nötig, Implementierungsaufwand reduziert sich auf Client-Code. Im Gegenzug Abhängigkeit von einem externen, nicht selbst kontrollierten Dienst (Verfügbarkeit, Rate-Limits, keine Garantien Dritter); Session-Trennung muss selbst über UUID-basierte Topics gelöst werden, da der Broker öffentlich und nicht authentifiziert ist.

---

## ADR-D2: Session-Isolation über UUID statt Authentifizierung

**Status:** Accepted

**Context:** Mehrere Nutzer könnten gleichzeitig denselben öffentlichen MQTT-Broker verwenden. Steuerbefehle eines Smartphones dürfen nur die zugehörige Desktop-Session beeinflussen.

**Decision:** Jede Desktop-Session generiert eine zufällige UUID und kommuniziert ausschließlich über Topics, die diese UUID enthalten (`pse2025/carworld/<sessionId>/gyro`). Die Kopplung von Smartphone und Desktop erfolgt über einen QR-Code, der die UUID als URL-Parameter enthält.

**Consequences:** Einfache, serverlose Isolation ohne Login-Mechanismus oder Backend-seitige Session-Verwaltung. Kein echter Schutz gegen gezielten Missbrauch (UUID ist kein kryptographisches Geheimnis im strengen Sinn, lediglich praktisch nicht erratbar) – für den gegebenen Anwendungsfall (Demo/Prüfungsleistung, kein produktiver Mehrnutzerbetrieb mit Sicherheitsanforderungen) als ausreichend bewertet.

---

## ADR-D3: Zielgeschwindigkeits-Modell statt Beschleunigungs-Akkumulation für die Fahrzeugphysik

**Status:** Accepted

**Context:** Frühe Implementierung akkumulierte die Geschwindigkeit kontinuierlich, solange Gas gegeben wurde – dadurch war es nicht möglich, eine konstante Zwischengeschwindigkeit zu halten, da das Fahrzeug bei gehaltenem Input immer weiter Richtung Maximalgeschwindigkeit beschleunigte.

**Decision:** Der Eingabewert (Gyroskop-Neigung bzw. Tastatur) wird als proportionale Zielgeschwindigkeit interpretiert (z. B. 50 % Neigung → 50 % der Maximalgeschwindigkeit); das Fahrzeug nähert sich dieser Zielgeschwindigkeit mit fester Rate an und hält sie, solange der Input konstant bleibt.

**Consequences:** Intuitiveres Fahrverhalten, das sich näher an einer Gaspedal-Metapher orientiert. Etwas höhere Komplexität in der Update-Funktion (Unterscheidung Annähern vs. Ausrollen), aber klar gekapselt in einer einzelnen Methode.

---

## ADR-D4: Externes GLTF-Cockpit-Modell statt ausschließlich handgebauter Geometrie

**Status:** Accepted

**Context:** Ein selbst aus Three.js-Primitiven gebautes Low-Poly-Cockpit war funktionsfähig, aber visuell limitiert. Für Konsistenz mit dem Fahrzeugkonfigurator eines anderen Gruppenmitglieds (der ein detailliertes GLTF-Modell nutzt) war ein Wechsel auf dasselbe Modell wünschenswert.

**Decision:** Integration eines Sketchfab-GLTF-Exports (Lamborghini Revuelto) als Cockpit-Quelle, mit Filterung auf interior-relevante Objektgruppen (Whitelist nach Namen) und manueller Korrektur einer versteckten Eltern-Transformation (Rotation/Skalierung) aus dem Sketchfab-Export.

**Consequences:** Höhere visuelle Qualität und Konsistenz mit dem Konfigurator-Modul. Erhöhter Implementierungsaufwand durch nicht dokumentierte Modell-Eigenheiten (verschachtelte Transformationen, uneinheitliche Rotationsachsen für Animationen); das ursprünglich parallel vorgehaltene handgebaute Cockpit (`InteriorBuilder.ts`) wird weiterhin als Fallback im Projekt vorgehalten.

---

## ADR-D5: Verzicht auf Datenbank-Persistenz von Fahrsitzungen

**Status:** Accepted

**Context:** Es wäre möglich gewesen, Fahrsitzungen (Start, Dauer, Höchstgeschwindigkeit) über eine eigene REST-Route in der Projekt-Postgres-Datenbank zu speichern, was einen zusätzlichen, eigenständigen Backend-Bezug der Komponente hergestellt hätte.

**Decision:** Aus Zeitgründen wird auf diese Persistenzschicht verzichtet; die Komponente bleibt vollständig clientseitig (abgesehen vom externen MQTT-Broker und der serverseitigen Tunnel-URL-Auflösung).

**Consequences:** Reduzierter Implementierungsaufwand, früherer funktionsfähiger Stand. Die Komponente weist dadurch keinen eigenen Datenbankzugriff und keine eigene REST-API für Fachdaten auf, was im Kontext einer Backend-Entwicklungsveranstaltung als Lücke auffallen kann und explizit im Statement of Work benannt wird.