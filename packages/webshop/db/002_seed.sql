-- Kategorien
INSERT INTO categories (slug, name) VALUES
  ('kleidung',      'Kleidung'),
  ('accessoires',   'Accessoires'),
  ('zubehoer',      'Zubehör'),
  ('sammlerartikel','Sammlerartikel')
ON CONFLICT (slug) DO NOTHING;

-- Produkte
INSERT INTO products (category_id, slug, name, description, base_price, image_url, attributes)
VALUES
  (
    (SELECT id FROM categories WHERE slug = 'kleidung'),
    'autodrive-t-shirt-classic',
    'AutoDrive T-Shirt Classic',
    'Klassisches Baumwoll-Shirt mit AutoDrive-Logo auf der Brust.',
    29.99,
    'https://placehold.co/600x400/ececec/999?text=T-Shirt+Classic',
    '{"material": "100% Baumwolle", "schnitt": "Regular Fit", "gewicht_g": 180}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'kleidung'),
    'autodrive-hoodie-fleece',
    'AutoDrive Hoodie Fleece',
    'Warmer Fleece-Hoodie mit Kängurutasche und eingesticktem Logo.',
    54.99,
    'https://placehold.co/600x400/ececec/999?text=Hoodie+Fleece',
    '{"material": "80% Baumwolle, 20% Polyester", "schnitt": "Oversized", "gewicht_g": 420}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'kleidung'),
    'autodrive-cap-snapback',
    'AutoDrive Snapback Cap',
    'Verstellbare Snapback-Cap mit gesticktem AutoDrive-Logo.',
    24.99,
    'https://placehold.co/600x400/ececec/999?text=Snapback+Cap',
    '{"material": "100% Baumwolle", "verschluss": "Snapback", "einheitsgroesse": true}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'autodrive-tasse-350ml',
    'AutoDrive Tasse 350ml',
    'Hochwertige Keramiktasse, spülmaschinenfest.',
    14.99,
    'https://placehold.co/600x400/ececec/999?text=Tasse+350ml',
    '{"volumen_ml": 350, "material": "Keramik", "spuelmaschine": true}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'autodrive-tasse-500ml',
    'AutoDrive Jumbo-Tasse 500ml',
    'Die große Tasse für lange Fahrten. Keramik, spülmaschinenfest.',
    17.99,
    'https://placehold.co/600x400/ececec/999?text=Tasse+500ml',
    '{"volumen_ml": 500, "material": "Keramik", "spuelmaschine": true}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'accessoires'),
    'autodrive-schluesselanhaenger',
    'AutoDrive Schlüsselanhänger',
    'Massiver Metall-Schlüsselanhänger mit Gravur.',
    9.99,
    'https://placehold.co/600x400/ececec/999?text=Schlüsselanhänger',
    '{"material": "Zinklegierung", "gravierbar": true, "gewicht_g": 28}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'zubehoer'),
    'lenkrad-abdeckung-leder',
    'Lenkrad-Abdeckung Echtleder',
    'Echtleder-Abdeckung, universell passend für 37–39 cm Lenkräder.',
    34.99,
    'https://placehold.co/600x400/ececec/999?text=Lenkrad-Abdeckung',
    '{"material": "Echtleder", "kompatibilitaet": "37-39cm Durchmesser", "hersteller": "AutoDrive OEM"}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'zubehoer'),
    'kofferraum-matte-universal',
    'Kofferraumschutz-Matte Universal',
    'Rutschfeste Gummimatte für den Kofferraum, zuschneidbar.',
    19.99,
    'https://placehold.co/600x400/ececec/999?text=Kofferraum-Matte',
    '{"material": "Gummi", "masse_cm": "120x80", "zuschneidbar": true, "hersteller": "AutoDrive OEM"}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'sammlerartikel'),
    'modellauto-edition-1',
    'Modellauto AutoDrive Edition 1',
    'Limitiertes Druckguss-Modellauto im Maßstab 1:18.',
    79.99,
    'https://placehold.co/600x400/ececec/999?text=Modellauto',
    '{"massstab": "1:18", "material": "Druckguss-Metall", "limitiert": true, "auflage": 500}'
  ),
  (
    (SELECT id FROM categories WHERE slug = 'sammlerartikel'),
    'autodrive-poster-a2',
    'AutoDrive Poster A2',
    'Hochwertiger A2-Kunstdruck auf mattem Papier, 200g.',
    19.99,
    'https://placehold.co/600x400/ececec/999?text=Poster+A2',
    '{"format": "A2", "papier_g": 200, "finish": "Matt"}'
  )
ON CONFLICT (slug) DO NOTHING;

-- Varianten T-Shirt
INSERT INTO product_variants (product_id, sku, options, price_delta, stock)
SELECT id, 'TSC-S-BLK',  '{"size":"S",  "color":"Schwarz"}'::jsonb, 0,    15 FROM products WHERE slug = 'autodrive-t-shirt-classic'
UNION ALL
SELECT id, 'TSC-M-BLK',  '{"size":"M",  "color":"Schwarz"}'::jsonb, 0,    22 FROM products WHERE slug = 'autodrive-t-shirt-classic'
UNION ALL
SELECT id, 'TSC-L-BLK',  '{"size":"L",  "color":"Schwarz"}'::jsonb, 0,    18 FROM products WHERE slug = 'autodrive-t-shirt-classic'
UNION ALL
SELECT id, 'TSC-XL-BLK', '{"size":"XL", "color":"Schwarz"}'::jsonb, 2.00, 8  FROM products WHERE slug = 'autodrive-t-shirt-classic'
UNION ALL
SELECT id, 'TSC-S-WHT',  '{"size":"S",  "color":"Weiß"}'::jsonb,    0,    10 FROM products WHERE slug = 'autodrive-t-shirt-classic'
UNION ALL
SELECT id, 'TSC-M-WHT',  '{"size":"M",  "color":"Weiß"}'::jsonb,    0,    14 FROM products WHERE slug = 'autodrive-t-shirt-classic'
ON CONFLICT (sku) DO NOTHING;

-- Varianten Hoodie
INSERT INTO product_variants (product_id, sku, options, price_delta, stock)
SELECT id, 'HFL-S-GRY',  '{"size":"S",  "color":"Grau"}'::jsonb,    0,    6  FROM products WHERE slug = 'autodrive-hoodie-fleece'
UNION ALL
SELECT id, 'HFL-M-GRY',  '{"size":"M",  "color":"Grau"}'::jsonb,    0,    11 FROM products WHERE slug = 'autodrive-hoodie-fleece'
UNION ALL
SELECT id, 'HFL-L-GRY',  '{"size":"L",  "color":"Grau"}'::jsonb,    0,    9  FROM products WHERE slug = 'autodrive-hoodie-fleece'
UNION ALL
SELECT id, 'HFL-M-BLK',  '{"size":"M",  "color":"Schwarz"}'::jsonb, 0,    7  FROM products WHERE slug = 'autodrive-hoodie-fleece'
ON CONFLICT (sku) DO NOTHING;

-- Einheitsvarianten (Produkte ohne Auswahl)
INSERT INTO product_variants (product_id, sku, options, price_delta, stock)
SELECT id, 'CAP-ONE', '{}'::jsonb, 0, 30 FROM products WHERE slug = 'autodrive-cap-snapback'
UNION ALL
SELECT id, 'TAS-350', '{}'::jsonb, 0, 40 FROM products WHERE slug = 'autodrive-tasse-350ml'
UNION ALL
SELECT id, 'TAS-500', '{}'::jsonb, 0, 25 FROM products WHERE slug = 'autodrive-tasse-500ml'
UNION ALL
SELECT id, 'KEY-ONE', '{}'::jsonb, 0, 60 FROM products WHERE slug = 'autodrive-schluesselanhaenger'
UNION ALL
SELECT id, 'LKR-ONE', '{}'::jsonb, 0, 12 FROM products WHERE slug = 'lenkrad-abdeckung-leder'
UNION ALL
SELECT id, 'KFM-ONE', '{}'::jsonb, 0, 18 FROM products WHERE slug = 'kofferraum-matte-universal'
UNION ALL
SELECT id, 'MOD-ED1', '{}'::jsonb, 0, 3  FROM products WHERE slug = 'modellauto-edition-1'
UNION ALL
SELECT id, 'POS-A2',  '{}'::jsonb, 0, 50 FROM products WHERE slug = 'autodrive-poster-a2'
ON CONFLICT (sku) DO NOTHING;