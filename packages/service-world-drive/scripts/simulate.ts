import mqtt from 'mqtt';

const TOPIC              = 'psecars/worlddrive/telemetry';
const INTERVAL_MS        = 200;
const SPEED_REFERENCE_MS = 1000; // OSRM waypoints designed for ~1s steps — keeps speed realistic
const MAX_SPEED_MS       = 100 / 3.6; // cap at 100 km/h

// Route: Schlossplatz → Hauptbahnhof → Rotebühlplatz → Schlossplatz (~3.5 km)
const WAYPOINTS: Array<[number, number]> = [
  [48.7778, 9.1800], // Schlossplatz
  [48.7845, 9.1827], // Hauptbahnhof
  [48.7815, 9.1680], // Rotebühlplatz
  [48.7778, 9.1800], // Schlossplatz (Start)
];

interface OsrmResponse {
  code: string;
  routes?: Array<{ geometry: { coordinates: Array<[number, number]> } }>;
}

/**
 * Berechnet die Luftdistanz in Metern nach der Haversine Formel welche die Erdkrümmung mit berücksichtigt
 * 
 */
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000; //Radius Erdkugel
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Berchnet die Straßenroute anhand der WAYPOINTS und der OSRM Libary
 */

async function getRoadRoute(waypoints: Array<[number, number]>): Promise<Array<[number, number]>> {
  const coordinates = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';'); //Mapping benötigt für die GeoJSON-Konvention die OSRM benötigt
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok){
      throw new Error(`HTTP ${res.status}`);
    } 
    const json = (await res.json()) as OsrmResponse;
    if (json.code !== 'Ok' || !json.routes?.[0]){
      throw new Error(`OSRM: ${json.code}`);
    } 
    return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } finally {
    clearTimeout(timeout);
  }
}

async function main(): Promise<void> {
  let route: Array<[number, number]>;

  try {
    route = await getRoadRoute(WAYPOINTS);
  } catch (err) {
    console.warn('[Simulator] OSRM unavailable, using manual fallback:', (err as Error).message);
    route = WAYPOINTS; //Fallback wenn die OSRM nicht läuft
  }

  const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://broker.hivemq.com:1883'; //TODO: Check mit den anderen ob wir .env Variablen nutzen wollen -> Code bleibt so unberührt
  const client    = mqtt.connect(brokerUrl, { reconnectPeriod: 5000 });
  let index       = 0;

  client.on('connect', () => {
    console.log(`[Simulator] Connected — driving ${route.length} waypoints every ${INTERVAL_MS} ms`);

    const interval = setInterval(() => {
      const [lat, lng] = route[index];
      const [prevLat, prevLng] = route[index === 0 ? route.length - 1 : index - 1];
      const dist  = haversineMeters(prevLat, prevLng, lat, lng);
      const speed = Math.min(dist / (SPEED_REFERENCE_MS / 1000), MAX_SPEED_MS);

      client.publish(
        TOPIC,
        JSON.stringify({ lat, lng, speed, timestamp: new Date().toISOString() }),
        {},
        (err) => {
          if (err) {
            console.error('[Simulator] Publish error:', err.message);
          } else {
            console.log(
              `[Simulator] [${String(index + 1).padStart(3)}/${route.length}] ${lat.toFixed(5)}, ${lng.toFixed(5)} — ${(speed * 3.6).toFixed(1)} km/h`,
            );
          }
        },
      );

      index = (index + 1) % route.length;
      if (index === 0){
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
}

main().catch(console.error);
