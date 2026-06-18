/**
 * Simulates a car driving a compact loop through Stuttgart city center.
 * Waypoints follow major streets and are spaced ~150–200 m apart
 * so movement looks smooth rather than jumping between distant cities.
 *
 * Usage: npm run simulate
 */
import mqtt from 'mqtt';

const TOPIC = 'pse2025/psecars/worlddrive/position';
const INTERVAL_MS = 1000;

// Compact loop through Stuttgart Innenstadt, clockwise, ~5 km total.
// Each consecutive pair is roughly 150–200 m apart — no building-hopping.
const route: Array<[number, number]> = [
  [48.7778, 9.1800], // Schlossplatz
  [48.7795, 9.1800], // Bolzstraße
  [48.7812, 9.1797], // Büchsenstraße
  [48.7828, 9.1796], // Kriegsbergstraße
  [48.7840, 9.1803], // Bahnhof Süd
  [48.7848, 9.1820], // Hauptbahnhof
  [48.7853, 9.1790], // Arnulf-Klett-Platz
  [48.7856, 9.1762], // Lautenschlagerstraße
  [48.7850, 9.1738], // Friedrichstraße
  [48.7840, 9.1718], // Schwabstraße Richtung
  [48.7825, 9.1700], // Rotebühlstraße
  [48.7810, 9.1682], // Rotebühlplatz
  [48.7796, 9.1665], // Möhringer Str
  [48.7779, 9.1658], // Tübinger Straße
  [48.7762, 9.1665], // Heusteigstraße
  [48.7745, 9.1678], // Marienplatz Zufahrt
  [48.7728, 9.1698], // Marienplatz
  [48.7715, 9.1723], // Eugenstraße
  [48.7710, 9.1750], // Charlottenplatz
  [48.7715, 9.1775], // Schillerplatz
  [48.7728, 9.1790], // Stiftstraße
  [48.7742, 9.1789], // Leonhardsplatz
  [48.7756, 9.1783], // Marktplatz
  [48.7762, 9.1797], // Kirchstraße
  [48.7770, 9.1800], // Schloßplatz Süd
  [48.7778, 9.1800], // Schlossplatz (zurück zum Start)
];

const host = process.env.MQTT_BROKER_HOST ?? 'localhost';
const port = process.env.MQTT_BROKER_PORT ?? '1883';
const brokerUrl = `mqtt://${host}:${port}`;

console.log(`[Simulator] Connecting to ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl, { reconnectPeriod: 5000 });

let index = 0;

client.on('connect', () => {
  console.log(`[Simulator] Connected. ${route.length} waypoints, interval ${INTERVAL_MS}ms`);
  console.log(`[Simulator] Publishing to ${TOPIC}`);

  const interval = setInterval(() => {
    const [lat, lng] = route[index];
    const payload = JSON.stringify({ lat, lng, timestamp: new Date().toISOString() });

    client.publish(TOPIC, payload, {}, (err) => {
      if (err) {
        console.error('[Simulator] Publish error:', err.message);
      } else {
        console.log(`[Simulator] [${String(index + 1).padStart(2)}/${route.length}] ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    });

    index = (index + 1) % route.length;
    if (index === 0) {
      console.log('[Simulator] Loop complete — restarting');
    }
  }, INTERVAL_MS);

  process.on('SIGINT', () => {
    clearInterval(interval);
    client.end();
    console.log('\n[Simulator] Stopped.');
    process.exit(0);
  });
});

client.on('error', (err) => {
  console.error('[Simulator] Connection error:', err.message);
  process.exit(1);
});
