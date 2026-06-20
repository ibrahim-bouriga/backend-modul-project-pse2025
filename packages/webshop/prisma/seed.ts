import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function productImage(slug: string): string {
    return `/products/${slug}.png`;
}

async function main() {
    // Categories
    const clothing = await prisma.category.upsert({
        where: { slug: 'clothing' },
        update: {},
        create: { slug: 'clothing', name: 'Clothing' },
    });
    const accessories = await prisma.category.upsert({
        where: { slug: 'accessories' },
        update: {},
        create: { slug: 'accessories', name: 'Accessories' },
    });
    const carAccessories = await prisma.category.upsert({
        where: { slug: 'car-accessories' },
        update: {},
        create: { slug: 'car-accessories', name: 'Car Accessories' },
    });
    const collectibles = await prisma.category.upsert({
        where: { slug: 'collectibles' },
        update: {},
        create: { slug: 'collectibles', name: 'Collectibles' },
    });

    // Products
    const tshirt = await prisma.product.upsert({
        where: { slug: 'mypsecar-t-shirt-classic' },
        update: {},
        create: {
            categoryId: clothing.id,
            slug: 'mypsecar-t-shirt-classic',
            name: 'MyPSECar T-Shirt Classic',
            description: 'Classic cotton T-shirt with MyPSECar logo on the chest.',
            basePrice: 29.99,
            imageUrl: productImage('mypsecar-t-shirt-classic'),
            attributes: { material: '100% Cotton', fit: 'Regular Fit', weight_g: 180 },
        },
    });

    const hoodie = await prisma.product.upsert({
        where: { slug: 'mypsecar-hoodie-fleece' },
        update: {},
        create: {
            categoryId: clothing.id,
            slug: 'mypsecar-hoodie-fleece',
            name: 'MyPSECar Hoodie Fleece',
            description: 'Warm fleece hoodie with kangaroo pocket and embroidered logo.',
            basePrice: 54.99,
            imageUrl: productImage('mypsecar-hoodie-fleece'),
            attributes: { material: '80% Cotton, 20% Polyester', fit: 'Oversized', weight_g: 420 },
        },
    });

    const cap = await prisma.product.upsert({
        where: { slug: 'mypsecar-cap-snapback' },
        update: {},
        create: {
            categoryId: clothing.id,
            slug: 'mypsecar-cap-snapback',
            name: 'MyPSECar Snapback Cap',
            description: 'Adjustable snapback cap with embroidered MyPSECar logo.',
            basePrice: 24.99,
            imageUrl: productImage('mypsecar-cap-snapback'),
            attributes: { material: '100% Cotton', closure: 'Snapback', oneSize: true },
        },
    });

    const mug350 = await prisma.product.upsert({
        where: { slug: 'mypsecar-mug-350ml' },
        update: {},
        create: {
            categoryId: accessories.id,
            slug: 'mypsecar-mug-350ml',
            name: 'MyPSECar Mug 350ml',
            description: 'High-quality ceramic mug, dishwasher safe.',
            basePrice: 14.99,
            imageUrl: productImage('mypsecar-mug-350ml'),
            attributes: { volume_ml: 350, material: 'Ceramic', dishwasherSafe: true },
        },
    });

    const mug500 = await prisma.product.upsert({
        where: { slug: 'mypsecar-mug-500ml' },
        update: {},
        create: {
            categoryId: accessories.id,
            slug: 'mypsecar-mug-500ml',
            name: 'MyPSECar Jumbo Mug 500ml',
            description: 'The big mug for long drives. Ceramic, dishwasher safe.',
            basePrice: 17.99,
            imageUrl: productImage('mypsecar-mug-500ml'),
            attributes: { volume_ml: 500, material: 'Ceramic', dishwasherSafe: true },
        },
    });

    const keychain = await prisma.product.upsert({
        where: { slug: 'mypsecar-keychain' },
        update: {},
        create: {
            categoryId: accessories.id,
            slug: 'mypsecar-keychain',
            name: 'MyPSECar Keychain',
            description: 'Solid metal keychain with engraving.',
            basePrice: 9.99,
            imageUrl: productImage('mypsecar-keychain'),
            attributes: { material: 'Zinc alloy', engravable: true, weight_g: 28 },
        },
    });

    const steeringWheelCover = await prisma.product.upsert({
        where: { slug: 'mypsecar-steering-wheel-cover-leather' },
        update: {},
        create: {
            categoryId: carAccessories.id,
            slug: 'mypsecar-steering-wheel-cover-leather',
            name: 'Genuine Leather Steering Wheel Cover',
            description: 'Genuine leather cover, universal fit for 37–39 cm steering wheels.',
            basePrice: 34.99,
            imageUrl: productImage('mypsecar-steering-wheel-cover-leather'),
            attributes: { material: 'Genuine leather', compatibility: '37-39cm diameter' },
        },
    });

    const trunkMat = await prisma.product.upsert({
        where: { slug: 'mypsecar-trunk-mat-universal' },
        update: {},
        create: {
            categoryId: carAccessories.id,
            slug: 'mypsecar-trunk-mat-universal',
            name: 'Universal Trunk Protection Mat',
            description: 'Non-slip rubber mat for the trunk, trimmable.',
            basePrice: 19.99,
            imageUrl: productImage('mypsecar-trunk-mat-universal'),
            attributes: { material: 'Rubber', dimensions_cm: '120x80', trimmable: true },
        },
    });

    const modelCar = await prisma.product.upsert({
        where: { slug: 'mypsecar-model-car-edition-1' },
        update: {},
        create: {
            categoryId: collectibles.id,
            slug: 'mypsecar-model-car-edition-1',
            name: 'MyPSECar Edition 1 Model Car',
            description: 'Limited die-cast model car at 1:18 scale.',
            basePrice: 79.99,
            imageUrl: productImage('mypsecar-model-car-edition-1'),
            attributes: { scale: '1:18', material: 'Die-cast metal', limited: true, edition: 500 },
        },
    });

    const poster = await prisma.product.upsert({
        where: { slug: 'mypsecar-poster-a2' },
        update: {},
        create: {
            categoryId: collectibles.id,
            slug: 'mypsecar-poster-a2',
            name: 'MyPSECar Poster A2',
            description: 'High-quality A2 art print on matte paper, 200g.',
            basePrice: 19.99,
            imageUrl: productImage('mypsecar-poster-a2'),
            attributes: { format: 'A2', paper_g: 200, finish: 'Matte' },
        },
    });

    // T-Shirt variants
    const tshirtVariants = [
        { sku: 'TSC-S-BLK', options: { size: 'S', color: 'Black' }, priceDelta: 0, stock: 15 },
        { sku: 'TSC-M-BLK', options: { size: 'M', color: 'Black' }, priceDelta: 0, stock: 22 },
        { sku: 'TSC-L-BLK', options: { size: 'L', color: 'Black' }, priceDelta: 0, stock: 18 },
        { sku: 'TSC-XL-BLK', options: { size: 'XL', color: 'Black' }, priceDelta: 2.00, stock: 8 },
        { sku: 'TSC-S-WHT', options: { size: 'S', color: 'White' }, priceDelta: 0, stock: 10 },
        { sku: 'TSC-M-WHT', options: { size: 'M', color: 'White' }, priceDelta: 0, stock: 14 },
    ];
    for (const v of tshirtVariants) {
        await prisma.productVariant.upsert({
            where: { sku: v.sku },
            update: {},
            create: { productId: tshirt.id, ...v },
        });
    }

    // Hoodie variants
    const hoodieVariants = [
        { sku: 'HFL-S-GRY', options: { size: 'S', color: 'Gray' }, priceDelta: 0, stock: 6 },
        { sku: 'HFL-M-GRY', options: { size: 'M', color: 'Gray' }, priceDelta: 0, stock: 11 },
        { sku: 'HFL-L-GRY', options: { size: 'L', color: 'Gray' }, priceDelta: 0, stock: 9 },
        { sku: 'HFL-M-BLK', options: { size: 'M', color: 'Black' }, priceDelta: 0, stock: 7 },
    ];
    for (const v of hoodieVariants) {
        await prisma.productVariant.upsert({
            where: { sku: v.sku },
            update: {},
            create: { productId: hoodie.id, ...v },
        });
    }

    // Single variants (products without selection)
    const single = [
        { sku: 'CAP-ONE', productId: cap.id },
        { sku: 'MUG-350', productId: mug350.id },
        { sku: 'MUG-500', productId: mug500.id },
        { sku: 'KEY-ONE', productId: keychain.id },
        { sku: 'SWC-ONE', productId: steeringWheelCover.id },
        { sku: 'TRM-ONE', productId: trunkMat.id },
        { sku: 'MOD-ED1', productId: modelCar.id },
        { sku: 'POS-A2', productId: poster.id },
    ];
    for (const v of single) {
        await prisma.productVariant.upsert({
            where: { sku: v.sku },
            update: {},
            create: { ...v, options: {}, priceDelta: 0, stock: 20 },
        });
    }

    console.log('Seed completed successfully!');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });