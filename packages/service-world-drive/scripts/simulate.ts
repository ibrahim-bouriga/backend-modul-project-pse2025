/**
 * Fetches a real road route from the public OSRM API (no key needed),
 * then simulates a car driving along it by publishing GPS positions to MQTT.
 *
 * Usage: npm run simulate
 */
import mqtt from 'mqtt';

const TOPIC = 'pse2025/psecars/worlddrive/position';
const INTERVAL_MS = 1000;

// Small Stuttgart loop: Schlossplatz → Hauptbahnhof → Rotebühlplatz → Schlossplatz (~3.5 km)
const WAYPOINTS: Array<[number, number]> = [
  [48.7778, 9.1800], // Schlossplatz
  [48.7845, 9.1827], // Hauptbahnhof
  [48.7815, 9.1680], // Rotebühlplatz
  [48.7778, 9.1800], // Schlossplatz (loop)
];

interface OsrmResponse {
  code: string;
  routes?: Array<{
    geometry: {
      coordinates: Array<[number, number]>;
    };
  }>;
}

async function fetchRoadRoute(waypoints: Array<[number, number]>): Promise<Array<[number, number]>> {
  // OSRM expects lng,lat — we store lat,lng
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = (await res.json()) as OsrmResponse;
    if (json.code !== 'Ok' || !json.routes?.[0]) throw new Error(`OSRM: ${json.code}`);

    // GeoJSON uses [lng, lat] — convert to [lat, lng]
    return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } finally {
    clearTimeout(timeout);
  }
}

async function main(): Promise<void> {
  let route: Array<[number, number]>;

  try {
    console.log('[Simulator] Fetching road route from OSRM...');
    route = await fetchRoadRoute(WAYPOINTS);
    console.log(`[Simulator] Got ${route.length} road waypoints`);
  } catch (err) {
    console.warn('[Simulator] OSRM unavailable, using manual fallback:', (err as Error).message);
    route = WAYPOINTS;
  }

  const host = process.env.MQTT_BROKER_HOST ?? 'localhost';
  const port = process.env.MQTT_BROKER_PORT ?? '1883';
  const brokerUrl = `mqtt://${host}:${port}`;

  console.log(`[Simulator] Connecting to ${brokerUrl}...`);
  const client = mqtt.connect(brokerUrl, { reconnectPeriod: 5000 });
  let index = 0;

  client.on('connect', () => {
    console.log(`[Simulator] Connected — driving ${route.length} waypoints every ${INTERVAL_MS} ms`);

    const interval = setInterval(() => {
      const [lat, lng] = route[index];
      const payload = JSON.stringify({ lat, lng, timestamp: new Date().toISOString() });

      client.publish(TOPIC, payload, {}, (err) => {
        if (err) {
          console.error('[Simulator] Publish error:', err.message);
        } else {
          console.log(`[Simulator] [${String(index + 1).padStart(3)}/${route.length}] ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      });

      index = (index + 1) % route.length;
      if (index === 0) console.log('[Simulator] Loop complete — restarting');
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
}

main().catch(console.error);
