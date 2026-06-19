/**
 *
 * NOTE: This document is AI-generated and serves as sample/placeholder data
 * until the database is populated with real production data.
 *
 * This script populates the database with sample data for development and testing:
 * - Car models and configurations
 * - Merchandise products
 * - User vehicles with initial status
 * - Super car for world drive tracking
 *
 * Run with: npx prisma db seed
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Get current file directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../.env') });

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('Using DATABASE_URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Initialize Prisma Client with adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seed...');

  // ============================================
  // 1. SEED CAR MODELS
  // ============================================
  console.log('Seeding car models...');

  const thunderGT = await prisma.car.create({
    data: {
      make: 'PSE Motors',
      model: 'Thunder GT',
      year: 2025,
      description: 'The Thunder GT combines raw power with refined elegance. Featuring a twin-turbo V8 engine producing 650 horsepower, this grand tourer delivers exhilarating performance while maintaining supreme comfort for long-distance cruising.',
      basePrice: 89999.00,
      imageUrl: '/images/cars/thunder-gt.jpg',
      specs: {
        horsepower: 650,
        topSpeed: 320,
        acceleration: 3.2,
        weight: 1650,
        engine: 'Twin-Turbo V8',
        transmission: '8-Speed Automatic',
        drivetrain: 'AWD'
      },
      available: true,
    },
  });

  const hyperion = await prisma.car.create({
    data: {
      make: 'PSE Motors',
      model: 'Hyperion',
      year: 2025,
      description: 'The Hyperion represents the pinnacle of automotive engineering. With a hybrid powertrain delivering over 1000 horsepower, advanced aerodynamics, and cutting-edge technology, this hypercar redefines what\'s possible on four wheels.',
      basePrice: 299999.00,
      imageUrl: '/images/cars/hyperion.jpg',
      specs: {
        horsepower: 1050,
        topSpeed: 380,
        acceleration: 2.1,
        weight: 1450,
        engine: 'Hybrid V12 + Electric Motors',
        transmission: '7-Speed Dual-Clutch',
        drivetrain: 'AWD'
      },
      available: true,
    },
  });

  const urbanE = await prisma.car.create({
    data: {
      make: 'PSE Motors',
      model: 'Urban-E',
      year: 2025,
      description: 'The Urban-E is our vision for sustainable urban mobility. This fully electric compact car offers impressive range, quick charging, and smart city features, all wrapped in a stylish and practical package perfect for modern city living.',
      basePrice: 42999.00,
      imageUrl: '/images/cars/urban-e.jpg',
      specs: {
        horsepower: 250,
        topSpeed: 180,
        acceleration: 5.8,
        weight: 1750,
        engine: 'Dual Electric Motors',
        transmission: 'Single-Speed',
        drivetrain: 'AWD',
        range: 450,
        batteryCapacity: 85
      },
      available: true,
    },
  });

  const sportX = await prisma.car.create({
    data: {
      make: 'PSE Motors',
      model: 'Sport-X',
      year: 2025,
      description: 'The Sport-X is the ultimate performance SUV. Combining the practicality of an SUV with the heart of a sports car, it features a powerful engine, sport-tuned suspension, and luxurious interior that seats five in comfort.',
      basePrice: 74999.00,
      imageUrl: '/images/cars/sport-x.jpg',
      specs: {
        horsepower: 500,
        topSpeed: 270,
        acceleration: 4.2,
        weight: 2100,
        engine: 'Supercharged V6',
        transmission: '8-Speed Automatic',
        drivetrain: 'AWD'
      },
      available: true,
    },
  });

  const classicRoadster = await prisma.car.create({
    data: {
      make: 'PSE Motors',
      model: 'Classic Roadster',
      year: 2025,
      description: 'A modern interpretation of classic roadster design. The Classic Roadster offers pure driving pleasure with its lightweight construction, naturally aspirated engine, and manual transmission. Perfect for enthusiasts who appreciate the art of driving.',
      basePrice: 54999.00,
      imageUrl: '/images/cars/classic-roadster.jpg',
      specs: {
        horsepower: 320,
        topSpeed: 250,
        acceleration: 4.8,
        weight: 1250,
        engine: 'Naturally Aspirated Inline-6',
        transmission: '6-Speed Manual',
        drivetrain: 'RWD'
      },
      available: true,
    },
  });

  console.log(`Created ${5} car models`);

  // ============================================
  // 2. SEED CAR CONFIGURATIONS
  // ============================================
  console.log('Seeding car configurations...');

  await prisma.carConfiguration.createMany({
    data: [
      // Thunder GT configurations
      {
        carId: thunderGT.id,
        color: '#FF0000',
        wheels: 'Sport 20-inch Alloy',
        interior: 'Black Leather',
        extras: { sunroof: true, sportPackage: false, premiumAudio: true },
        price: 94999.00,
        modelUrl: '/models/thunder-gt-red.glb',
      },
      {
        carId: thunderGT.id,
        color: '#000000',
        wheels: 'Chrome 21-inch',
        interior: 'Tan Leather',
        extras: { sunroof: true, sportPackage: true, premiumAudio: true },
        price: 99999.00,
        modelUrl: '/models/thunder-gt-black.glb',
      },
      // Hyperion configurations
      {
        carId: hyperion.id,
        color: '#FFD700',
        wheels: 'Carbon Fiber 22-inch',
        interior: 'Carbon Fiber Racing',
        extras: { trackPackage: true, ceramicBrakes: true, titaniumExhaust: true },
        price: 349999.00,
        modelUrl: '/models/hyperion-gold.glb',
      },
    ],
  });

  console.log('Created car configurations');

  // ============================================
  // 3. SEED MERCHANDISE PRODUCTS
  // ============================================
  console.log('Seeding merchandise products...');

  await prisma.product.createMany({
    data: [
      // Apparel
      {
        name: 'PSE Racing Jacket',
        description: 'Premium racing jacket with PSE Motors branding. Made from high-quality materials with embroidered logos and racing stripes.',
        price: 149.99,
        category: 'apparel',
        imageUrl: '/images/products/racing-jacket.jpg',
        stock: 50,
        available: true,
      },
      {
        name: 'Thunder GT T-Shirt',
        description: 'Comfortable cotton t-shirt featuring the iconic Thunder GT design. Available in multiple sizes.',
        price: 29.99,
        category: 'apparel',
        imageUrl: '/images/products/thunder-tshirt.jpg',
        stock: 200,
        available: true,
      },
      {
        name: 'PSE Motors Cap',
        description: 'Adjustable baseball cap with embroidered PSE Motors logo. Perfect for sunny days.',
        price: 24.99,
        category: 'apparel',
        imageUrl: '/images/products/pse-cap.jpg',
        stock: 150,
        available: true,
      },
      {
        name: 'Hyperion Hoodie',
        description: 'Warm and stylish hoodie featuring Hyperion graphics. Premium cotton blend.',
        price: 79.99,
        category: 'apparel',
        imageUrl: '/images/products/hyperion-hoodie.jpg',
        stock: 100,
        available: true,
      },
      // Accessories
      {
        name: 'PSE Keychain',
        description: 'Metal keychain with PSE Motors logo. Comes in a premium gift box.',
        price: 14.99,
        category: 'accessories',
        imageUrl: '/images/products/keychain.jpg',
        stock: 500,
        available: true,
      },
      {
        name: 'Carbon Fiber Phone Case',
        description: 'Sleek phone case with real carbon fiber finish and PSE branding. Compatible with latest iPhone and Samsung models.',
        price: 49.99,
        category: 'accessories',
        imageUrl: '/images/products/phone-case.jpg',
        stock: 75,
        available: true,
      },
      {
        name: 'Racing Gloves',
        description: 'Professional-grade racing gloves with PSE Motors branding. Genuine leather with reinforced palms.',
        price: 89.99,
        category: 'accessories',
        imageUrl: '/images/products/racing-gloves.jpg',
        stock: 60,
        available: true,
      },
      {
        name: 'PSE Travel Mug',
        description: 'Insulated stainless steel travel mug keeps drinks hot or cold for hours. Features PSE Motors logo.',
        price: 19.99,
        category: 'accessories',
        imageUrl: '/images/products/travel-mug.jpg',
        stock: 300,
        available: true,
      },
      // Collectibles
      {
        name: 'Thunder GT 1:18 Scale Model',
        description: 'Highly detailed die-cast model of the Thunder GT. Perfect for collectors.',
        price: 129.99,
        category: 'collectibles',
        imageUrl: '/images/products/thunder-model.jpg',
        stock: 40,
        available: true,
      },
      {
        name: 'Hyperion 1:18 Scale Model',
        description: 'Limited edition die-cast model of the Hyperion hypercar. Numbered and comes with certificate of authenticity.',
        price: 299.99,
        category: 'collectibles',
        imageUrl: '/images/products/hyperion-model.jpg',
        stock: 25,
        available: true,
      },
      {
        name: 'PSE Motors Poster Set',
        description: 'Set of 3 high-quality posters featuring PSE Motors vehicles. Perfect for garage or office.',
        price: 39.99,
        category: 'collectibles',
        imageUrl: '/images/products/poster-set.jpg',
        stock: 100,
        available: true,
      },
      {
        name: 'Racing Helmet Replica',
        description: 'Full-size replica of PSE Motors racing helmet. Display quality with authentic details.',
        price: 249.99,
        category: 'collectibles',
        imageUrl: '/images/products/helmet-replica.jpg',
        stock: 15,
        available: true,
      },
    ],
  });

  console.log('Created 12 merchandise products');

  // ============================================
  // 4. SEED USER VEHICLES
  // ============================================
  console.log('Seeding user vehicles...');

  const userVehicle1 = await prisma.userVehicle.create({
    data: {
      userId: 'user_demo_001',
      carId: thunderGT.id,
      nickname: 'My Thunder',
      vin: 'PSE2025TGT1234567',
      purchaseDate: new Date('2025-01-15'),
    },
  });

  const userVehicle2 = await prisma.userVehicle.create({
    data: {
      userId: 'user_demo_001',
      carId: urbanE.id,
      nickname: 'City Cruiser',
      vin: 'PSE2025URE7654321',
      purchaseDate: new Date('2024-11-20'),
    },
  });

  const userVehicle3 = await prisma.userVehicle.create({
    data: {
      userId: 'user_demo_002',
      carId: sportX.id,
      nickname: 'Family Rocket',
      vin: 'PSE2025SPX9876543',
      purchaseDate: new Date('2025-03-10'),
    },
  });

  console.log('Created 3 user vehicles');

  // ============================================
  // 5. SEED INITIAL VEHICLE STATUS
  // ============================================
  console.log('Seeding initial vehicle status...');

  await prisma.vehicleStatus.createMany({
    data: [
      // Thunder GT status
      {
        vehicleId: userVehicle1.id,
        fuelLevel: 75.5,
        latitude: 48.8566,
        longitude: 2.3522,
        speed: 0,
        timestamp: new Date(),
      },
      // Urban-E status
      {
        vehicleId: userVehicle2.id,
        fuelLevel: 82.0, // Battery level for electric
        latitude: 51.5074,
        longitude: -0.1278,
        speed: 0,
        timestamp: new Date(),
      },
      // Sport-X status
      {
        vehicleId: userVehicle3.id,
        fuelLevel: 45.3,
        latitude: 40.7128,
        longitude: -74.0060,
        speed: 0,
        timestamp: new Date(),
      },
    ],
  });

  console.log('Created initial vehicle status records');

  // ============================================
  // 6. SEED SUPER CAR
  // ============================================
  console.log('Seeding super car for World Drive...');

  await prisma.superCar.create({
    data: {
      name: 'PSE Hyperion World Tour',
      latitude: 52.5200, // Berlin
      longitude: 13.4050,
      speed: 0,
      heading: 90, // East
      timestamp: new Date(),
      active: true,
    },
  });

  console.log('Created super car entry');

  console.log('\nDatabase seed completed successfully!');
  console.log('\nSummary:');
  console.log(`   - ${5} car models`);
  console.log(`   - ${3} car configurations`);
  console.log(`   - ${12} merchandise products`);
  console.log(`   - ${3} user vehicles`);
  console.log(`   - ${3} vehicle status records`);
  console.log(`   - ${1} super car`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
