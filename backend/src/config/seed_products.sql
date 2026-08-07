-- ============================================================
--  SOCIALGROUP — DUMMY PRODUCT SEED DATA
--  20 products across 4 categories with full tier pricing
--  seller_id = 1 (admin), status = 'active' (bypass approval)
-- ============================================================

-- First add 4 more categories for richer browsing
INSERT INTO categories (name, commission_pct) VALUES
('Beauty & Personal Care', 10.00),
('Sports & Fitness',       8.00),
('Books & Stationery',     6.00),
('Toys & Games',           9.00)
ON CONFLICT (name) DO NOTHING;

-- ──────────────────────────────────────────────────────────
-- CATEGORY 1: Electronics (id=1)
-- ──────────────────────────────────────────────────────────

-- Product 1: Wireless Noise-Cancelling Headphones
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 1, 'Sony WH-1000XM5 Wireless Headphones',
 'Industry-leading noise cancellation with 30-hour battery life. Crystal-clear hands-free calling and multipoint connection. Ultra-comfortable ear cushions for all-day wear.',
 '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop&q=80"]',
 'ELEC-WH1000-001', 150, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,19999),(2,16999),(3,14999),(5,12499),(10,9999)) AS t(gs,pr)
WHERE sku = 'ELEC-WH1000-001';

-- Product 2: Smart Watch Fitness Tracker
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 1, 'Apple Watch SE GPS 44mm',
 'Health and fitness tracking with heart rate sensor, SpO2 monitor, and sleep tracking. Crash Detection and Emergency SOS. Water-resistant up to 50 metres.',
 '["https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"]',
 'ELEC-AWSE-002', 80, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,32999),(2,28999),(3,25999),(5,22999),(10,18999)) AS t(gs,pr)
WHERE sku = 'ELEC-AWSE-002';

-- Product 3: Mechanical Keyboard
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 1, 'Keychron K2 Wireless Mechanical Keyboard',
 'Compact 75% layout with hot-swappable switches. RGB backlight with 15 lighting effects. Compatible with Mac and Windows. Triple mode connectivity: Bluetooth 5.1 + USB-C.',
 '["https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=600&auto=format&fit=crop&q=80"]',
 'ELEC-K2KB-003', 120, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,8999),(2,7499),(3,6799),(5,5999),(10,4999)) AS t(gs,pr)
WHERE sku = 'ELEC-K2KB-003';

-- Product 4: Portable Bluetooth Speaker
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 1, 'JBL Charge 5 Portable Bluetooth Speaker',
 '20 hours of playtime with powerful JBL Pro Sound. IP67 waterproof and dustproof. Built-in power bank to charge devices. PartyBoost for pairing multiple JBL speakers.',
 '["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&auto=format&fit=crop&q=80"]',
 'ELEC-JBL5-004', 200, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,13999),(2,11499),(3,9999),(5,8499),(10,6999)) AS t(gs,pr)
WHERE sku = 'ELEC-JBL5-004';

-- Product 5: Laptop Stand + USB-C Hub Combo
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 1, 'Adjustable Laptop Stand with 7-in-1 USB-C Hub',
 'Ergonomic aluminum stand with 6 adjustable angles. Bundled 7-in-1 hub: 4K HDMI, 2x USB-A 3.0, USB-C PD 100W, SD/TF card reader. Compatible with all 12"–17" laptops.',
 '["https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&auto=format&fit=crop&q=80"]',
 'ELEC-LSTD-005', 300, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,3999),(2,3299),(3,2899),(5,2499),(10,1999)) AS t(gs,pr)
WHERE sku = 'ELEC-LSTD-005';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 2: Apparel & Fashion (id=2)
-- ──────────────────────────────────────────────────────────

-- Product 6: Premium Cotton T-Shirts
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 2, 'Supima Cotton Oversized T-Shirt (Pack of 3)',
 '100% Supima cotton for the softest feel. Relaxed oversized silhouette. Pre-shrunk and colourfast. Available in White, Black, and Sand. Sizes S to 3XL.',
 '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&auto=format&fit=crop&q=80"]',
 'APRL-CTSH-006', 500, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,1999),(2,1599),(3,1399),(5,1199),(10,899)) AS t(gs,pr)
WHERE sku = 'APRL-CTSH-006';

-- Product 7: Premium Denim Jacket
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 2, 'Classic Raw Denim Jacket — Unisex',
 'Raw selvedge denim with a relaxed trucker silhouette. Brass button closures. Chest pockets and interior quilted lining for winter readiness. Unisex sizing.',
 '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600&auto=format&fit=crop&q=80"]',
 'APRL-DNJK-007', 180, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,4999),(2,4199),(3,3699),(5,3199),(10,2599)) AS t(gs,pr)
WHERE sku = 'APRL-DNJK-007';

-- Product 8: Running Sneakers
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 2, 'Nike Air Zoom Pegasus 41 Running Shoes',
 'React foam midsole delivers responsive cushioning. Air Zoom unit in the forefoot for a snappier feel. Engineered mesh upper for breathability. Available in 6 colourways.',
 '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1539185441755-769473a23570?w=600&auto=format&fit=crop&q=80"]',
 'APRL-NKPG-008', 250, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,10999),(2,9199),(3,8199),(5,7199),(10,5999)) AS t(gs,pr)
WHERE sku = 'APRL-NKPG-008';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 3: Home & Kitchen (id=3)
-- ──────────────────────────────────────────────────────────

-- Product 9: Air Fryer
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 3, 'Philips HD9200 Air Fryer 4.1L',
 'Rapid Air Technology circulates hot air for 90% less fat. 4.1L capacity feeds up to 4 people. 7 preset programmes: chips, chicken, steak, fish, shrimp, cake, pizza.',
 '["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80"]',
 'HOME-AFRY-009', 120, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,8499),(2,7099),(3,6299),(5,5499),(10,4499)) AS t(gs,pr)
WHERE sku = 'HOME-AFRY-009';

-- Product 10: Robot Vacuum Cleaner
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 3, 'Roborock Q5 Pro Robot Vacuum & Mop',
 '5500Pa strong suction with PreciSense LiDAR navigation. Automatically empties itself for up to 7 weeks. 180-min runtime covers large homes. Works with Alexa & Google Home.',
 '["https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80"]',
 'HOME-ROBV-010', 60, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,34999),(2,29999),(3,26999),(5,23999),(10,19999)) AS t(gs,pr)
WHERE sku = 'HOME-ROBV-010';

-- Product 11: Stainless Steel Cookware Set
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 3, 'Tri-Ply Stainless Steel Cookware Set (7 Piece)',
 'Professional-grade tri-ply clad stainless steel. Works on all cooktops including induction. Oven-safe up to 260°C. Lifetime warranty included. Set: 2 saucepans, 1 stockpot, 2 fry pans, lid set.',
 '["https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80"]',
 'HOME-COOK-011', 90, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,12999),(2,10799),(3,9499),(5,8299),(10,6999)) AS t(gs,pr)
WHERE sku = 'HOME-COOK-011';

-- Product 12: Smart LED Light Strip
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 3, 'Govee 5m RGBIC Smart LED Light Strip',
 '16 million colours with RGBIC technology — multiple colours simultaneously. Works with Alexa, Google Assistant, and Govee App. Music sync mode with built-in mic. Easy peel-and-stick install.',
 '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1513506003901-1e6a35068a57?w=600&auto=format&fit=crop&q=80"]',
 'HOME-LEDS-012', 400, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,2499),(2,1999),(3,1749),(5,1499),(10,1199)) AS t(gs,pr)
WHERE sku = 'HOME-LEDS-012';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 4: Groceries (id=4)
-- ──────────────────────────────────────────────────────────

-- Product 13: Premium Dryfruits Combo
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 4, 'Premium Dry Fruits Gift Hamper (1.5 kg)',
 'Handpicked from the finest farms: Kashmiri walnuts (250g), California almonds (250g), Afghan pistachios (250g), Iranian dates (250g), golden raisins (250g), cashews W180 (250g). No added sulphur.',
 '["https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&auto=format&fit=crop&q=80"]',
 'GROC-DRYF-013', 500, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,1699),(2,1399),(3,1249),(5,1099),(10,849)) AS t(gs,pr)
WHERE sku = 'GROC-DRYF-013';

-- Product 14: Cold-Pressed Oils Combo
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 4, 'Cold Pressed Cooking Oils Combo — 3 Bottles (1L each)',
 'Virgin Coconut Oil, Wood-Pressed Groundnut Oil, and Cold-Pressed Sesame Oil. Zero refining, zero chemicals, retains natural nutrients. Suitable for cooking, skin, and hair.',
 '["https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1526434426615-1abe81efcb0b?w=600&auto=format&fit=crop&q=80"]',
 'GROC-OILS-014', 350, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,1299),(2,1099),(3,949),(5,799),(10,649)) AS t(gs,pr)
WHERE sku = 'GROC-OILS-014';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 5: Beauty & Personal Care (id=5)
-- ──────────────────────────────────────────────────────────

-- Product 15: Skincare Routine Kit
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 5, 'The Ordinary Complete AM + PM Skincare Routine Kit',
 'Curated morning and evening routine kit: Hyaluronic Acid 2%+B5, Niacinamide 10%+Zinc 1%, Buffet Multi-Technology Peptide Serum, AHA 30%+BHA 2% Peeling Solution, High-Adherence Silicone Primer. Dermatologist approved.',
 '["https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop&q=80"]',
 'BEAU-SKIN-015', 220, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,4499),(2,3699),(3,3299),(5,2899),(10,2299)) AS t(gs,pr)
WHERE sku = 'BEAU-SKIN-015';

-- Product 16: Beard Grooming Kit
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 5, 'Men''s Complete Beard Grooming Gift Kit',
 'Everything a beardsman needs: Premium Beard Oil (60ml), Beard Balm (50g), Boar Bristle Brush, Steel Beard Comb, Beard Wash (100ml), and Moustache Wax. Presented in a premium wooden box.',
 '["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=600&auto=format&fit=crop&q=80"]',
 'BEAU-BGKT-016', 180, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,2499),(2,1999),(3,1749),(5,1499),(10,1199)) AS t(gs,pr)
WHERE sku = 'BEAU-BGKT-016';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 6: Sports & Fitness (id=6)
-- ──────────────────────────────────────────────────────────

-- Product 17: Yoga Mat Premium
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 6, 'Manduka PRO Yoga Mat 6mm — Non-Slip Performance',
 'Closed-cell surface prevents sweat absorption and bacteria growth. 6mm cushioning protects joints. Lifetime guarantee. Superior grip improves as you warm up. 180cm × 66cm. 3kg.',
 '["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&auto=format&fit=crop&q=80"]',
 'SPRT-YOGA-017', 160, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,6999),(2,5799),(3,5199),(5,4499),(10,3699)) AS t(gs,pr)
WHERE sku = 'SPRT-YOGA-017';

-- Product 18: Adjustable Dumbbell Set
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 6, 'PowerBlock Elite Adjustable Dumbbell Set (5–32.5 kg)',
 'Replaces 28 pairs of dumbbells. Quick selector pin changes weight in seconds. Compact square design saves 90% of floor space. Auto-lock mechanism prevents plates from sliding. Expandable to 50 kg.',
 '["https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&auto=format&fit=crop&q=80"]',
 'SPRT-DUMV-018', 75, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,24999),(2,20999),(3,18999),(5,16499),(10,13999)) AS t(gs,pr)
WHERE sku = 'SPRT-DUMV-018';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 7: Books & Stationery (id=7)
-- ──────────────────────────────────────────────────────────

-- Product 19: Business Books Bundle
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 7, 'Top 10 Business Bestsellers Bundle',
 'Curated must-reads: Atomic Habits, Zero to One, The Lean Startup, Thinking Fast and Slow, The Psychology of Money, Good to Great, Sapiens, Start With Why, The Hard Thing About Hard Things, Deep Work. Hardcover editions.',
 '["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600&auto=format&fit=crop&q=80"]',
 'BOOK-BUSS-019', 400, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,3999),(2,3299),(3,2899),(5,2499),(10,1999)) AS t(gs,pr)
WHERE sku = 'BOOK-BUSS-019';

-- ──────────────────────────────────────────────────────────
-- CATEGORY 8: Toys & Games (id=8)
-- ──────────────────────────────────────────────────────────

-- Product 20: LEGO Architecture Set
INSERT INTO products (seller_id, category_id, name, description, images, sku, stock, status) VALUES
(1, 8, 'LEGO Architecture Skyline Collection — New York City',
 '598 pieces build iconic Manhattan skyline including Empire State Building, Chrysler Building, and One World Trade Center. Suitable for ages 12+. Dimensions: 10cm tall × 33cm wide when built.',
 '["https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1588591795084-1770cb3be374?w=600&auto=format&fit=crop&q=80"]',
 'TOYS-LEGO-020', 140, 'active');

INSERT INTO product_tiers (product_id, group_size, price)
SELECT id, gs, pr FROM products, (VALUES (1,5999),(2,4999),(3,4499),(5,3899),(10,3199)) AS t(gs,pr)
WHERE sku = 'TOYS-LEGO-020';

-- ──────────────────────────────────────────────────────────
-- VERIFICATION QUERY
-- ──────────────────────────────────────────────────────────
SELECT 
  p.id, p.name, c.name as category,
  COUNT(pt.id) as tier_count,
  MIN(pt.price) as best_price,
  MAX(pt.price) as solo_price,
  ROUND(((MAX(pt.price) - MIN(pt.price)) / MAX(pt.price)) * 100) as max_discount_pct
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN product_tiers pt ON pt.product_id = p.id
GROUP BY p.id, p.name, c.name
ORDER BY p.id;
