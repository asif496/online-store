-- seed.sql
USE online_store;

-- Clear existing data (for re-seeding)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE product_photos;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE reviews;
TRUNCATE TABLE products;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO products (id, name, description, category, price, taxRate, stockQty, createdAt) VALUES
(1,  'Jamdani Saree (Dhaka)',        'Handwoven jamdani with soft finish, perfect for occasions.',          'Apparel',     4500.00, 0.05,  4, NOW()),
(2,  'Nakshi Kantha Throw',          'Traditional embroidered throw with vibrant patterns.',                 'Handicrafts', 1800.00, 0.05, 12, NOW()),
(3,  'Khadi Panjabi (Men)',          'Breathable khadi panjabi, classic fit.',                               'Apparel',     1500.00, 0.05,  9, NOW()),
(4,  'Jute Tote Bag',               'Eco-friendly jute tote, sturdy handles, everyday use.',                'Handicrafts',  450.00, 0.05, 25, NOW()),
(5,  'Sylhet Green Tea (250g)',      'Fresh aroma, smooth taste—great for daily tea sessions.',              'Grocery',      320.00, 0.05, 40, NOW()),
(6,  'Bogura Mishti Doi (500g)',     'Creamy sweet yogurt inspired by Bogura style.',                        'Sweets',       280.00, 0.05, 14, NOW()),
(7,  'Hilsa Fish (Ilish) ~1kg',      'Premium ilish cut, ideal for bhapa or curry.',                         'Seafood',     1600.00, 0.02,  6, NOW()),
(8,  'Chattogram Mezban Spice Mix',  'Aromatic spice blend for mezban-style beef/chicken.',                  'Spices',       220.00, 0.05, 30, NOW()),
(9,  'Fuchka Starter Kit',           'Spice mix + tamarind base + crunchy puri pack (demo kit).',            'Snacks',       350.00, 0.05, 20, NOW()),
(10, 'Sundarbans Honey (500g)',      'Natural honey taste profile inspired by Sundarbans region.',           'Grocery',      650.00, 0.05, 16, NOW()),
(11, 'Natore Mango Pickle (400g)',   'Tangy mango achar—balanced spice and oil.',                            'Grocery',      240.00, 0.05, 22, NOW()),
(12, 'Rajshahi Silk Scarf',         'Soft silk scarf with subtle shine and clean edges.',                   'Apparel',     1200.00, 0.05, 10, NOW()),
(13, 'Cox''s Bazar Sea Salt (1kg)', 'Coarse sea salt for cooking and seasoning.',                           'Grocery',      120.00, 0.05, 60, NOW()),
(14, 'Comilla Rosh Malai (6 pcs)',  'Soft rosh malai-style sweets for dessert lovers.',                     'Sweets',       480.00, 0.05,  3, NOW()),
(15, 'Dhamrai Pottery Mug',         'Handmade ceramic-style mug, rustic texture (demo item).',              'Home',         380.00, 0.05, 18, NOW());

INSERT INTO reviews (productId, customerName, rating, comment, createdAt) VALUES
-- Jamdani Saree
(1,'Rafi',5,'Looks premium and the weave feels authentic.',NOW()),
(1,'Nusrat',4,'Beautiful design—delivery demo was smooth.',NOW()),
(1,'Mim',5,'Great for presentation day!',NOW()),
(1,'Sultana',5,'The jamdani pattern is exquisite.',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(1,'Taslima',4,'Very elegant, would gift this.',DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Nakshi Kantha
(2,'Sadia',5,'Stitch work is impressive for an assignment demo.',NOW()),
(2,'Tamim',4,'Nice colors, feels handmade.',NOW()),
(2,'Fatema',5,'Love the vibrant embroidery.',DATE_SUB(NOW(), INTERVAL 1 DAY)),
(2,'Karim',3,'Good but stitching slightly uneven.',DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Khadi Panjabi
(3,'Arafat',4,'Comfortable and neat fit.',NOW()),
(3,'Shila',5,'Simple but classy.',NOW()),
(3,'Rahat',4,'Good value for the price.',NOW()),
(3,'Sumon',5,'Perfect for Eid!',DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Jute Tote Bag
(4,'Hasan',5,'Love the eco look—very modern UI match.',NOW()),
(4,'Jannat',4,'Strong and clean finish.',NOW()),
(4,'Mitu',5,'Great gift idea.',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(4,'Robin',3,'A bit rough but durable.',DATE_SUB(NOW(), INTERVAL 6 DAY)),

-- Sylhet Green Tea
(5,'Farzana',5,'Aroma is nice—good grocery demo product.',NOW()),
(5,'Imran',4,'Works well with the dashboard charts.',NOW()),
(5,'Sharmin',5,'Smooth and refreshing taste.',DATE_SUB(NOW(), INTERVAL 1 DAY)),
(5,'Asif',4,'Nice mild flavor.',DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Bogura Mishti Doi
(6,'Mahi',5,'Sweet and creamy—great example item.',NOW()),
(6,'Sifat',4,'Nice dessert product for variety.',NOW()),
(6,'Poly',5,'Perfectly sweetened.',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6,'Jamal',4,'Authentic taste!',DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Hilsa Fish
(7,'Ovi',5,'Seafood category makes the store feel real.',NOW()),
(7,'Rupa',4,'Price/tax/stock logic works nicely.',NOW()),
(7,'Nayeem',3,'Stock ran out quickly (good real-time test).',NOW()),
(7,'Kabir',5,'Best ilish I have seen in a demo!',DATE_SUB(NOW(), INTERVAL 1 DAY)),
(7,'Laboni',4,'Good quality cut.',DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Mezban Spice Mix
(8,'Tanjil',5,'Spice mix is perfect for Bangladeshi context.',NOW()),
(8,'Arpita',4,'Good product description.',NOW()),
(8,'Shopon',5,'Authentic mezban aroma.',DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8,'Nasrin',4,'Very flavorful blend.',DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Fuchka Kit
(9,'Borna',5,'Fun item—review section looks great.',NOW()),
(9,'Sami',4,'Tamarind flavor note is a nice touch.',NOW()),
(9,'Nabila',5,'Perfect for a student demo store.',NOW()),
(9,'Rafiq',4,'Love the concept!',DATE_SUB(NOW(), INTERVAL 1 DAY)),

-- Sundarbans Honey
(10,'Shawon',5,'Honey product makes reports interesting.',NOW()),
(10,'Puja',4,'Good category diversity.',NOW()),
(10,'Tahmid',5,'Rich and natural flavor.',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10,'Reshma',5,'Best honey in the store!',DATE_SUB(NOW(), INTERVAL 4 DAY)),

-- Mango Pickle
(11,'Riyad',4,'Achar adds local flavor to the dataset.',NOW()),
(11,'Anika',5,'Nice balance—also helps rating charts.',NOW()),
(11,'Mithun',4,'Tangy and spicy—love it.',DATE_SUB(NOW(), INTERVAL 3 DAY)),
(11,'Priya',3,'A bit too oily for my taste.',DATE_SUB(NOW(), INTERVAL 5 DAY)),

-- Rajshahi Silk Scarf
(12,'Mehedi',5,'Silk scarf card looks premium on the storefront.',NOW()),
(12,'Sumi',4,'Great for UI showcasing.',NOW()),
(12,'Champa',5,'Gorgeous shine and texture.',DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12,'Reza',4,'Would love more color options.',DATE_SUB(NOW(), INTERVAL 6 DAY)),

-- Cox's Bazar Sea Salt
(13,'Kazi',4,'Cheap item helps show totals and taxes.',NOW()),
(13,'Nadia',3,'Basic but useful for stock demo.',NOW()),
(13,'Rakib',4,'Good coarse texture.',DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Rosh Malai
(14,'Priyanka',5,'Sweets category makes it feel realistic.',NOW()),
(14,'Jubayer',4,'Invoice looks clean with this order.',NOW()),
(14,'Meher',5,'Melt in your mouth!',DATE_SUB(NOW(), INTERVAL 1 DAY)),
(14,'Limon',4,'Just like Comilla famous rosh malai.',DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Dhamrai Pottery Mug
(15,'Rimon',4,'Mug is a nice home category product.',NOW()),
(15,'Ayesha',5,'Looks great in product detail page.',NOW()),
(15,'Nirob',4,'Rustic charm.',DATE_SUB(NOW(), INTERVAL 2 DAY)),
(15,'Sapna',5,'Unique and hand-crafted feel.',DATE_SUB(NOW(), INTERVAL 4 DAY));
