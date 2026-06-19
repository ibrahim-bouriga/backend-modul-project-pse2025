import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Kategorien
  const kleidung = await prisma.category.upsert({
    where: { slug: 'kleidung' },
    update: {},
    create: { slug: 'kleidung', name: 'Kleidung' },
  });
  const accessoires = await prisma.category.upsert({
    where: { slug: 'accessoires' },
    update: {},
    create: { slug: 'accessoires', name: 'Accessoires' },
  });
  const zubehoer = await prisma.category.upsert({
    where: { slug: 'zubehoer' },
    update: {},
    create: { slug: 'zubehoer', name: 'Zubehör' },
  });
  const sammler = await prisma.category.upsert({
    where: { slug: 'sammlerartikel' },
    update: {},
    create: { slug: 'sammlerartikel', name: 'Sammlerartikel' },
  });

  // Produkte
  const tshirt = await prisma.product.upsert({
    where: { slug: 'autodrive-t-shirt-classic' },
    update: {},
    create: {
      categoryId: kleidung.id,
      slug: 'autodrive-t-shirt-classic',
      name: 'AutoDrive T-Shirt Classic',
      description: 'Klassisches Baumwoll-Shirt mit AutoDrive-Logo auf der Brust.',
      basePrice: 29.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=T-Shirt+Classic',
      attributes: { material: '100% Baumwolle', schnitt: 'Regular Fit', gewicht_g: 180 },
    },
  });

  const hoodie = await prisma.product.upsert({
    where: { slug: 'autodrive-hoodie-fleece' },
    update: {},
    create: {
      categoryId: kleidung.id,
      slug: 'autodrive-hoodie-fleece',
      name: 'AutoDrive Hoodie Fleece',
      description: 'Warmer Fleece-Hoodie mit Kängurutasche und eingesticktem Logo.',
      basePrice: 54.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Hoodie+Fleece',
      attributes: { material: '80% Baumwolle, 20% Polyester', schnitt: 'Oversized', gewicht_g: 420 },
    },
  });

  const cap = await prisma.product.upsert({
    where: { slug: 'autodrive-cap-snapback' },
    update: {},
    create: {
      categoryId: kleidung.id,
      slug: 'autodrive-cap-snapback',
      name: 'AutoDrive Snapback Cap',
      description: 'Verstellbare Snapback-Cap mit gesticktem AutoDrive-Logo.',
      basePrice: 24.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Snapback+Cap',
      attributes: { material: '100% Baumwolle', verschluss: 'Snapback', einheitsgroesse: true },
    },
  });

  const tasse350 = await prisma.product.upsert({
    where: { slug: 'autodrive-tasse-350ml' },
    update: {},
    create: {
      categoryId: accessoires.id,
      slug: 'autodrive-tasse-350ml',
      name: 'AutoDrive Tasse 350ml',
      description: 'Hochwertige Keramiktasse, spülmaschinenfest.',
      basePrice: 14.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Tasse+350ml',
      attributes: { volumen_ml: 350, material: 'Keramik', spuelmaschine: true },
    },
  });

  const tasse500 = await prisma.product.upsert({
    where: { slug: 'autodrive-tasse-500ml' },
    update: {},
    create: {
      categoryId: accessoires.id,
      slug: 'autodrive-tasse-500ml',
      name: 'AutoDrive Jumbo-Tasse 500ml',
      description: 'Die große Tasse für lange Fahrten. Keramik, spülmaschinenfest.',
      basePrice: 17.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Tasse+500ml',
      attributes: { volumen_ml: 500, material: 'Keramik', spuelmaschine: true },
    },
  });

  const schluessel = await prisma.product.upsert({
    where: { slug: 'autodrive-schluesselanhaenger' },
    update: {},
    create: {
      categoryId: accessoires.id,
      slug: 'autodrive-schluesselanhaenger',
      name: 'AutoDrive Schlüsselanhänger',
      description: 'Massiver Metall-Schlüsselanhänger mit Gravur.',
      basePrice: 9.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Schlüsselanhänger',
      attributes: { material: 'Zinklegierung', gravierbar: true, gewicht_g: 28 },
    },
  });

  const lenkrad = await prisma.product.upsert({
    where: { slug: 'lenkrad-abdeckung-leder' },
    update: {},
    create: {
      categoryId: zubehoer.id,
      slug: 'lenkrad-abdeckung-leder',
      name: 'Lenkrad-Abdeckung Echtleder',
      description: 'Echtleder-Abdeckung, universell passend für 37–39 cm Lenkräder.',
      basePrice: 34.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Lenkrad-Abdeckung',
      attributes: { material: 'Echtleder', kompatibilitaet: '37-39cm Durchmesser' },
    },
  });

  const matte = await prisma.product.upsert({
    where: { slug: 'kofferraum-matte-universal' },
    update: {},
    create: {
      categoryId: zubehoer.id,
      slug: 'kofferraum-matte-universal',
      name: 'Kofferraumschutz-Matte Universal',
      description: 'Rutschfeste Gummimatte für den Kofferraum, zuschneidbar.',
      basePrice: 19.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Kofferraum-Matte',
      attributes: { material: 'Gummi', masse_cm: '120x80', zuschneidbar: true },
    },
  });

  const modellauto = await prisma.product.upsert({
    where: { slug: 'modellauto-edition-1' },
    update: {},
    create: {
      categoryId: sammler.id,
      slug: 'modellauto-edition-1',
      name: 'Modellauto AutoDrive Edition 1',
      description: 'Limitiertes Druckguss-Modellauto im Maßstab 1:18.',
      basePrice: 79.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Modellauto',
      attributes: { massstab: '1:18', material: 'Druckguss-Metall', limitiert: true, auflage: 500 },
    },
  });

  const poster = await prisma.product.upsert({
    where: { slug: 'autodrive-poster-a2' },
    update: {},
    create: {
      categoryId: sammler.id,
      slug: 'autodrive-poster-a2',
      name: 'AutoDrive Poster A2',
      description: 'Hochwertiger A2-Kunstdruck auf mattem Papier, 200g.',
      basePrice: 19.99,
      imageUrl: 'https://placehold.co/600x400/ececec/999?text=Poster+A2',
      attributes: { format: 'A2', papier_g: 200, finish: 'Matt' },
    },
  });

  // Varianten T-Shirt
  const tshirtVariants = [
    { sku: 'TSC-S-BLK',  options: { size: 'S',  color: 'Schwarz' }, priceDelta: 0,    stock: 15 },
    { sku: 'TSC-M-BLK',  options: { size: 'M',  color: 'Schwarz' }, priceDelta: 0,    stock: 22 },
    { sku: 'TSC-L-BLK',  options: { size: 'L',  color: 'Schwarz' }, priceDelta: 0,    stock: 18 },
    { sku: 'TSC-XL-BLK', options: { size: 'XL', color: 'Schwarz' }, priceDelta: 2.00, stock: 8  },
    { sku: 'TSC-S-WHT',  options: { size: 'S',  color: 'Weiß'    }, priceDelta: 0,    stock: 10 },
    { sku: 'TSC-M-WHT',  options: { size: 'M',  color: 'Weiß'    }, priceDelta: 0,    stock: 14 },
  ];
  for (const v of tshirtVariants) {
    await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: {},
      create: { productId: tshirt.id, ...v },
    });
  }

  // Varianten Hoodie
  const hoodieVariants = [
    { sku: 'HFL-S-GRY', options: { size: 'S', color: 'Grau'    }, priceDelta: 0, stock: 6  },
    { sku: 'HFL-M-GRY', options: { size: 'M', color: 'Grau'    }, priceDelta: 0, stock: 11 },
    { sku: 'HFL-L-GRY', options: { size: 'L', color: 'Grau'    }, priceDelta: 0, stock: 9  },
    { sku: 'HFL-M-BLK', options: { size: 'M', color: 'Schwarz' }, priceDelta: 0, stock: 7  },
  ];
  for (const v of hoodieVariants) {
    await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: {},
      create: { productId: hoodie.id, ...v },
    });
  }

  // Einheitsvarianten
  const single = [
    { sku: 'CAP-ONE', productId: cap.id        },
    { sku: 'TAS-350', productId: tasse350.id   },
    { sku: 'TAS-500', productId: tasse500.id   },
    { sku: 'KEY-ONE', productId: schluessel.id },
    { sku: 'LKR-ONE', productId: lenkrad.id    },
    { sku: 'KFM-ONE', productId: matte.id      },
    { sku: 'MOD-ED1', productId: modellauto.id },
    { sku: 'POS-A2',  productId: poster.id     },
  ];
  for (const v of single) {
    await prisma.productVariant.upsert({
      where: { sku: v.sku },
      update: {},
      create: { ...v, options: {}, priceDelta: 0, stock: 20 },
    });
  }

  console.log('Seed erfolgreich abgeschlossen!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });