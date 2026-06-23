import { PrismaClient } from '@prisma/client';

const CARS = [
  { id: 'car-a', name: 'Car A', color: '#f97316', topic: 'psecars/worlddrive/car-a/telemetry', source: 'simulator' },
  { id: 'car-b', name: 'Car B', color: '#3b82f6', topic: 'psecars/worlddrive/car-b/telemetry', source: 'simulator' },
];

const STUTTGART_ROUTE: Array<[number, number]> = [
  [48.7778, 9.1800],
  [48.7845, 9.1827],
  [48.7900, 9.1950],
  [48.7760, 9.2080],
  [48.7730, 9.1900],
  [48.7778, 9.1800],
];

const FRANKFURT_ROUTE: Array<[number, number]> = [
  [50.1106, 8.6822],
  [50.1149, 8.6737],
  [50.1071, 8.6638],
  [50.1020, 8.6822],
  [50.1130, 8.6950],
  [50.1106, 8.6822],
];

const SEED_TRIP_IDS = [
  'seed-v2-trip-a-0', 'seed-v2-trip-a-1', 'seed-v2-trip-a-2',
  'seed-v2-trip-b-0', 'seed-v2-trip-b-1', 'seed-v2-trip-b-2',
];

function interpolate(a: [number, number], b: [number, number], steps: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return pts;
}

function makeRoute(keypoints: Array<[number, number]>, stepsPerSegment = 12): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < keypoints.length - 1; i++) {
    pts.push(...interpolate(keypoints[i], keypoints[i + 1], stepsPerSegment).slice(0, -1));
  }
  return pts;
}

export async function runSeed(prisma: PrismaClient): Promise<void> {
  // Remove legacy hardcoded GPS car (replaced by dynamic registration)
  // Trips must be deleted first due to foreign key constraint
  const legacyTrips = await prisma.trip.findMany({ where: { carId: 'gps' }, select: { id: true } });
  if (legacyTrips.length > 0) {
    await prisma.trip.deleteMany({ where: { carId: 'gps' } });
  }
  await prisma.car.deleteMany({ where: { id: 'gps' } });

  for (const car of CARS) {
    await prisma.car.upsert({ where: { id: car.id }, update: {}, create: car });
  }
  const alreadySeeded = await prisma.trip.findFirst({ where: { id: { in: SEED_TRIP_IDS } } });
  if (alreadySeeded) return;

  const now = Date.now();
  const fakeTrips = [
    { id: 'seed-v2-trip-a-0', carId: 'car-a', route: STUTTGART_ROUTE, startOffset: 2  * 3600_000, duration: 9  * 60_000 },
    { id: 'seed-v2-trip-a-1', carId: 'car-a', route: STUTTGART_ROUTE, startOffset: 26 * 3600_000, duration: 12 * 60_000 },
    { id: 'seed-v2-trip-a-2', carId: 'car-a', route: STUTTGART_ROUTE, startOffset: 50 * 3600_000, duration: 7  * 60_000 },
    { id: 'seed-v2-trip-b-0', carId: 'car-b', route: FRANKFURT_ROUTE, startOffset: 3  * 3600_000, duration: 11 * 60_000 },
    { id: 'seed-v2-trip-b-1', carId: 'car-b', route: FRANKFURT_ROUTE, startOffset: 28 * 3600_000, duration: 14 * 60_000 },
    { id: 'seed-v2-trip-b-2', carId: 'car-b', route: FRANKFURT_ROUTE, startOffset: 52 * 3600_000, duration: 8  * 60_000 },
  ];

  for (const { id, carId, route, startOffset, duration } of fakeTrips) {
    const pts       = makeRoute(route);
    const startedAt = new Date(now - startOffset);
    const endedAt   = new Date(now - startOffset + duration);
    const dtPerPt   = duration / Math.max(pts.length, 1);

    await prisma.trip.create({
      data: {
        id,
        carId,
        startedAt,
        endedAt,
        waypoints: {
          create: pts.map(([lat, lng], i) => ({
            lat,
            lng,
            speed:     8 + Math.random() * 10,
            timestamp: new Date(startedAt.getTime() + i * dtPerPt),
          })),
        },
      },
    });
  }
  console.log('[Seed] 6 fake historical trips seeded');
}

if (require.main === module) {
  const prisma = new PrismaClient();
  runSeed(prisma)
    .then(() => prisma.$disconnect())
    .catch((err) => { console.error(err); prisma.$disconnect(); process.exit(1); });
}
