import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './db.js';
import { minio, ensurePublicBucket } from './minio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BUCKET = 'car-models';

const cars = [
    {
        name: 'Revuelto',
        year: 2024,
        category: 'Supercar',
        engine: 'V12 HPEV',
        power: '1 001 hp',
        acceleration: '2.5 s',
        topSpeed: '350+ km/h',
        imageKey: 'revuelto.webp',
    },
    {
        name: 'Huracán EVO',
        year: 2023,
        category: 'Supercar',
        engine: 'V10 NA',
        power: '640 hp',
        acceleration: '2.9 s',
        topSpeed: '325 km/h',
        imageKey: 'huracan-evo.jpg',
    },
    {
        name: 'Urus S',
        year: 2023,
        category: 'Super SUV',
        engine: 'V8 Biturbo',
        power: '666 hp',
        acceleration: '3.5 s',
        topSpeed: '305 km/h',
        imageKey: 'urus-s.jpg',
    },
    {
        name: 'Aventador SVJ',
        year: 2022,
        category: 'Limited',
        engine: 'V12 NA',
        power: '770 hp',
        acceleration: '2.8 s',
        topSpeed: '350 km/h',
        imageKey: 'aventador-svj.webp',
    },
    {
        name: 'Sterrato',
        year: 2023,
        category: 'Off-Road',
        engine: 'V10 NA',
        power: '610 hp',
        acceleration: '3.4 s',
        topSpeed: '260 km/h',
        imageKey: 'sterrato.webp',
    },
    {
        name: 'Huracán Tecnica',
        year: 2023,
        category: 'Supercar',
        engine: 'V10 NA',
        power: '640 hp',
        acceleration: '3.2 s',
        topSpeed: '325 km/h',
        imageKey: 'huracan-tecnica.jpg',
    },
];

export async function seed() {
    console.log('Seeding car_models...');

    await ensurePublicBucket(BUCKET);

    const imagesDir = path.join(__dirname, '..', 'images');

    for (const car of cars) {
        try {
            await minio.statObject(BUCKET, car.imageKey);
        } catch {
            const filePath = path.join(imagesDir, car.imageKey);
            if (fs.existsSync(filePath)) {
                await minio.fPutObject(BUCKET, car.imageKey, filePath);
                console.log(`Uploaded ${car.imageKey}`);
            } else {
                console.warn(`Image not found: ${filePath}`);
            }
        }

        await prisma.carModel.upsert({
            where: { name: car.name },
            update: {},
            create: car,
        });
    }

    console.log('Seeding complete.');
}