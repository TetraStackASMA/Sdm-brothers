-- ============================================================
-- SDM Brothers Pharmacy — Seed Data
-- seed.sql
-- ============================================================
-- Run AFTER schema.sql:
--   sqlite3 pharmacy.db < seed.sql
-- ============================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------
-- STORES
-- ------------------------------------------------------------
INSERT OR IGNORE INTO stores (store_name, address, city, phone_number) VALUES
('SDM Brothers - MG Road',        '12, MG Road, Near City Mall',         'Bengaluru',   '08041234567'),
('SDM Brothers - Koramangala',     '45, 5th Block, 80 Feet Road',         'Bengaluru',   '08049876543'),
('SDM Brothers - Indiranagar',     '22, 100 Feet Road, Indiranagar',      'Bengaluru',   '08044567890'),
('SDM Brothers - Whitefield',      'Shop 7, Phoenix Marketcity, ITPL Rd', 'Bengaluru',   '08043216543'),
('SDM Brothers - Jayanagar',       '34, 4th Block, Jayanagar',            'Bengaluru',   '08047654321');

-- ------------------------------------------------------------
-- EXAMPLE USER  (seed / demo only — passwords handled app-side)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO users (name, phone_number, address, preferred_store) VALUES
('Aarin Demo', '9876543210', '101, Brigade Road, Bengaluru 560025', 'SDM Brothers - MG Road');

-- ------------------------------------------------------------
-- MEDICINES  (30 products across all 11 categories)
-- ------------------------------------------------------------

-- Pain Relief
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Paracetamol 500mg (10 tabs)',   'Pain Relief',       'Relieves mild to moderate pain and fever.',                                  35,  200, 'images/paracetamol.png',    0),
('Ibuprofen 400mg (10 tabs)',     'Pain Relief',       'Anti-inflammatory pain reliever for headaches, muscle pain.',               55,  150, 'images/ibuprofen.png',      0),
('Combiflam (20 tabs)',           'Pain Relief',       'Combination of ibuprofen + paracetamol for faster relief.',                 92,  180, 'images/combiflam.png',      0);

-- Cold & Flu
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Vicks VapoRub (50 g)',          'Cold & Flu',        'Topical ointment for nasal congestion & cough.',                            95,  120, 'images/vicksvaporub.png',   0),
('Cetirizine 10mg (10 tabs)',     'Cold & Flu',        'Antihistamine for allergy and cold symptoms.',                              38,  160, 'images/cetirizine.png',     0),
('D-Cold Total (10 tabs)',        'Cold & Flu',        'Multi-symptom cold & flu relief tablet.',                                   65,  140, 'images/dcold.png',          0);

-- Digestive Health
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Digene Gel Mint (200 ml)',      'Digestive Health',  'Antacid suspension for acidity and heartburn.',                             120, 100, 'images/digene.png',         0),
('Sporlac Probiotic (10 caps)',   'Digestive Health',  'Restores intestinal flora after antibiotic use.',                           145, 80,  'images/sporlac.png',        0),
('ORS Sachet Lemon (5 pack)',     'Digestive Health',  'Oral rehydration salts for diarrhoea and dehydration.',                    25,  300, 'images/ors.png',            0);

-- Diabetes Care
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Glucometer OneTouch Select',    'Diabetes Care',     'Easy-to-use blood glucose monitoring device.',                              1450,30,  'images/glucometer.png',     0),
('Metformin 500mg (10 tabs)',     'Diabetes Care',     'First-line medication for Type-2 diabetes management.',                     28,  90,  'images/metformin.png',      1),
('Glucose Strips (25 pcs)',       'Diabetes Care',     'Compatible strips for standard glucometers.',                               299, 70,  'images/glucostrips.png',    0);

-- Heart Health
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Aspirin 75mg (14 tabs)',        'Heart Health',      'Low-dose aspirin for heart attack prevention.',                             42,  110, 'images/aspirin.png',        1),
('Amlodipine 5mg (10 tabs)',      'Heart Health',      'Calcium channel blocker for high blood pressure.',                          35,  95,  'images/amlodipine.png',     1),
('Atorvastatin 10mg (10 tabs)',   'Heart Health',      'Statin for lowering LDL cholesterol levels.',                               60,  85,  'images/atorvastatin.png',   1);

-- Antibiotics
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Amoxicillin 500mg (10 caps)',   'Antibiotics',       'Broad-spectrum antibiotic for bacterial infections.',                       95,  75,  'images/amoxicillin.png',    1),
('Azithromycin 500mg (3 tabs)',   'Antibiotics',       'Antibiotic for respiratory and skin infections.',                           110, 60,  'images/azithromycin.png',   1),
('Clindamycin 300mg (10 caps)',   'Antibiotics',       'Used for serious infections caused by bacteria.',                           185, 50,  'images/clindamycin.png',    1);

-- Skincare
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Cetaphil Gentle Cleanser 125ml','Skincare',          'Mild face wash for sensitive and dry skin.',                                350, 60,  'images/cetaphil.png',       0),
('Sunscreen SPF50+ 60ml',        'Skincare',           'Broad-spectrum UVA/UVB protection.',                                       280, 75,  'images/sunscreen.png',      0),
('Clotrimazole Cream 20g',       'Skincare',           'Antifungal cream for ringworm and athlete''s foot.',                        65,  90,  'images/clotrimazole.png',   0);

-- Hair Care
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Minoxidil 5% Solution 60ml',   'Hair Care',          'Topical solution to combat hair loss.',                                     650, 40,  'images/minoxidil.png',      0),
('Ketoconazole Shampoo 100ml',   'Hair Care',          'Anti-dandruff medicated shampoo.',                                          245, 55,  'images/ketoconazole.png',   0);

-- Oral Care
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Sensodyne Toothpaste 80g',     'Oral Care',          'For sensitive teeth — instant and long-lasting relief.',                    185, 80,  'images/sensodyne.png',      0),
('Chlorhexidine Mouthwash 150ml','Oral Care',          'Antiseptic mouthwash for gum infections.',                                  120, 65,  'images/chlorhexidine.png',  0);

-- Devices
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Digital Thermometer',          'Devices',            'Fast and accurate body temperature reading.',                               199, 50,  'images/thermometer.png',    0),
('Nebulizer Machine',            'Devices',            'Converts liquid medication to mist for respiratory relief.',                1899,20,  'images/nebulizer.png',      0);

-- Supplements
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Vitamin D3 60K IU (4 caps)',   'Supplements',        'Weekly Vitamin D supplement for bone health.',                              85,  130, 'images/vitamind3.png',      0),
('Omega-3 Fish Oil (30 caps)',   'Supplements',        'Supports heart, brain, and joint health.',                                  350, 100, 'images/omega3.png',         0);

-- Pet Care
INSERT OR IGNORE INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required) VALUES
('Frontline Spot On Dog M',      'Pet Care',           'Flea and tick topical treatment for medium dogs.',                          750, 30,  'images/frontline.png',      0),
('Pedigree Dentastix (7 pcs)',   'Pet Care',           'Daily dental chews for dogs to reduce tartar.',                             175, 45,  'images/dentastix.png',      0);

-- ------------------------------------------------------------
-- DEMO ORDER  (for testing order history)
-- ------------------------------------------------------------
INSERT OR IGNORE INTO orders (user_id, store_id, order_status, total_price, delivery_address) VALUES
(1, 1, 'delivered', 127.00, '101, Brigade Road, Bengaluru 560025');

INSERT OR IGNORE INTO order_items (order_id, medicine_id, quantity, price) VALUES
(1, 1, 2, 35.00),   -- 2x Paracetamol
(1, 4, 1, 95.00);   -- 1x Vicks VapoRub
