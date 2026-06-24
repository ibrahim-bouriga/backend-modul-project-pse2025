import mqtt from 'mqtt';

const INTERVAL_MS        = 200;
const SPEED_REFERENCE_MS = 1000;// OSRM waypoints designed for ~1s steps — keeps speed realistic
const MAX_SPEED_MS       = 60 / 3.6; // cap at 60 km/h

interface CarConfig {
  id:        string;
  topic:     string;
  waypoints: Array<[number, number]>;
}

const CARS: CarConfig[] = [
  {
    id:    'car-a',
    topic: 'psecars/worlddrive/car-a/telemetry',
    waypoints: [
      [48.7778, 9.1800], // Stuttgart Schlossplatz
      [48.7845, 9.1827], // Hauptbahnhof Stuttgart
      [48.7900, 9.1950], // Pragsattel
      [48.7850, 9.2100], // Löwentor
      [48.7760, 9.2080], // Mineralbäder
      [48.7730, 9.1900], // Wilhelmsplatz
      [48.7778, 9.1800], // Schlossplatz (loop)
    ],
  },
  {
    id:    'car-b',
    topic: 'psecars/worlddrive/car-b/telemetry',
    waypoints: [
      [50.1106, 8.6822], // Frankfurt Römer
      [50.1149, 8.6737], // Alte Oper
      [50.1071, 8.6638], // Hauptbahnhof Frankfurt
      [50.1020, 8.6822], // Sachsenhausen
      [50.1060, 8.7000], // Deutsches Museum
      [50.1130, 8.6950], // Dom/Römerberg
      [50.1106, 8.6822], // Römer (loop)
    ],
  },
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
  const R    = 6_371_000; //Radius Erdkugel
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/**
 * Berchnet die Straßenroute anhand der WAYPOINTS und der OSRM Libary
 */

async function getRoadRoute(waypoints: Array<[number, number]>): Promise<Array<[number, number]>> {
  const coordinates = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url         = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
  const controller  = new AbortController();
  const timeout     = setTimeout(() => controller.abort(), 10_000);
  try {
    const res  = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as OsrmResponse;
    if (json.code !== 'Ok' || !json.routes?.[0]) throw new Error(`OSRM: ${json.code}`);
    return json.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  } finally {
    clearTimeout(timeout);
  }
}

async function runCar(client: mqtt.MqttClient, car: CarConfig): Promise<void> {
  let route: Array<[number, number]>;
  try {
    route = await getRoadRoute(car.waypoints);
    console.log(`[${car.id}] Route loaded — ${route.length} points`);
  } catch (err) {
    console.warn(`[${car.id}] OSRM unavailable, using fallback:`, (err as Error).message);
    route = car.waypoints; //Fallback wenn die OSRM nicht verfügbar ist
  }

  let index = 0;

  setInterval(() => {
    const [lat, lng]         = route[index];
    const [prevLat, prevLng] = route[index === 0 ? route.length - 1 : index - 1];
    const dist               = haversineMeters(prevLat, prevLng, lat, lng);
    const speed              = Math.min(dist / (SPEED_REFERENCE_MS / 1000), MAX_SPEED_MS);

    client.publish(
      car.topic,
      JSON.stringify({ lat, lng, speed, timestamp: new Date().toISOString() }),
      {},
      (err) => { if (err) console.error(`[${car.id}] Publish error:`, err.message); },
    );

    index = (index + 1) % route.length;
  }, INTERVAL_MS);
}

export async function startSimulator(): Promise<void> {
  const brokerUrl = process.env.MQTT_BROKER_URL ?? 'mqtt://broker.hivemq.com:1883';
  const client    = mqtt.connect(brokerUrl, { reconnectPeriod: 5000 });

  client.on('connect', async () => {
    console.log(`[Simulator] Connected to ${brokerUrl} — starting ${CARS.length} cars`);
    for (const car of CARS) await runCar(client, car);
  });

  client.on('error', (err) => console.error('[Simulator] MQTT error:', err.message));
}

if (require.main === module) {
  startSimulator().catch(console.error);
  process.on('SIGINT', () => { console.log('\n[Simulator] Stopped.'); process.exit(0); });
}
