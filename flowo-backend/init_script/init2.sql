USE flowo_db;

-- =========================
-- USERS (10 total)
-- =========================
INSERT INTO User (firebase_uid, username, email, full_name, gender, role, created_at, updated_at) VALUES
('firebase_uid_john_doe',   'john_doe',   'john@example.com',   'John Doe',          'Male',   'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_admin_user', 'admin_user', 'admin@example.com',  'Admin User',        'Other',  'Admin',           NOW(), NOW()),
('firebase_uid_mary_jones', 'mary_jones', 'mary@example.com',   'Mary Jones',        'Female', 'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_tom_nguyen', 'tom_nguyen', 'tom@example.com',    'Tom Nguyen',        'Male',   'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_li_wei',     'li_wei',     'liwei@example.com',  'Li Wei',            'Male',   'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_fatima',     'fatima',     'fatima@example.com', 'Fatima Khan',       'Female', 'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_carlos',     'carlos',     'carlos@example.com', 'Carlos Hernandez',  'Male',   'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_anna',       'anna',       'anna@example.com',   'Anna Kovacs',       'Female', 'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_peter',      'peter',      'peter@example.com',  'Peter Owens',       'Male',   'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_sara',       'sara',       'sara@example.com',   'Sara Lee',          'Female', 'RegisteredBuyer', NOW(), NOW());

-- Handy variables
SET @uid_john   := 'firebase_uid_john_doe';
SET @uid_admin  := 'firebase_uid_admin_user';
SET @uid_mary   := 'firebase_uid_mary_jones';
SET @uid_tom    := 'firebase_uid_tom_nguyen';
SET @uid_li     := 'firebase_uid_li_wei';
SET @uid_fatima := 'firebase_uid_fatima';
SET @uid_carlos := 'firebase_uid_carlos';
SET @uid_anna   := 'firebase_uid_anna';
SET @uid_peter  := 'firebase_uid_peter';
SET @uid_sara   := 'firebase_uid_sara';

-- =========================
-- ADDRESSES
-- (John, Mary, Tom get 2; others 1 default)
-- =========================
INSERT INTO Address (firebase_uid, recipient_name, phone_number, street_address, city, postal_code, country, is_default_shipping) VALUES
(@uid_john,  'John Doe',   '1234567890', '123 Flower Street',  'New York',     '10001', 'USA',       TRUE),
(@uid_john,  'John Doe',   '1234567890', '456 Bloom Ave',      'New York',     '10001', 'USA',       FALSE),
(@uid_mary,  'Mary Jones', '1111111111', '10 Rosewood Ct',     'Seattle',      '98101', 'USA',       TRUE),
(@uid_mary,  'Mary Jones', '1111111111', '22 Meadow St',       'Seattle',      '98101', 'USA',       FALSE),
(@uid_tom,   'Tom Nguyen', '2222222222', '45 Nguyen Trai',     'Ha Noi',       '100000','Viet Nam',  TRUE),
(@uid_tom,   'Tom Nguyen', '2222222222', '88 Kim Ma',          'Ha Noi',       '100000','Viet Nam',  FALSE),
(@uid_li,    'Li Wei',     '3333333333', '9 Nanjing Rd',       'Shanghai',     '200000','China',     TRUE),
(@uid_fatima,'Fatima Khan','4444444444', '7 I.I.Chundrigar Rd','Karachi',      '74000', 'Pakistan',  TRUE),
(@uid_carlos,'Carlos Hdz', '5555555555', '123 Reforma',        'Mexico City',  '06500', 'Mexico',    TRUE),
(@uid_anna,  'Anna Kovacs','6666666666', '14 Váci utca',       'Budapest',     '1052',  'Hungary',   TRUE),
(@uid_peter, 'Peter Owens','7777777777', '8 O''Connell St',    'Dublin',       'D01',   'Ireland',   TRUE),
(@uid_sara,  'Sara Lee',   '8888888888', '5 Orchard Rd',       'Singapore',    '238823','Singapore', TRUE);

-- Cache address ids where we need separate billing
SET @addr_john_ship := (SELECT address_id FROM Address WHERE firebase_uid=@uid_john AND is_default_shipping=TRUE  LIMIT 1);
SET @addr_john_bill := (SELECT address_id FROM Address WHERE firebase_uid=@uid_john AND is_default_shipping=FALSE LIMIT 1);
SET @addr_mary_ship := (SELECT address_id FROM Address WHERE firebase_uid=@uid_mary AND is_default_shipping=TRUE  LIMIT 1);
SET @addr_mary_bill := (SELECT address_id FROM Address WHERE firebase_uid=@uid_mary AND is_default_shipping=FALSE LIMIT 1);
SET @addr_tom_ship  := (SELECT address_id FROM Address WHERE firebase_uid=@uid_tom  AND is_default_shipping=TRUE  LIMIT 1);
SET @addr_tom_bill  := (SELECT address_id FROM Address WHERE firebase_uid=@uid_tom  AND is_default_shipping=FALSE LIMIT 1);

-- =========================
-- FLOWER TYPES (10)
-- =========================
INSERT INTO FlowerType (name, description) VALUES
('Rose',           'Classic romantic flower'),
('Lily',           'Elegant and fragrant'),
('Orchid',         'Exotic and delicate'),
('Carnation',      'Long-lasting ruffled petals'),
('Daisy',          'Simple and cheerful'),
('Hydrangea',      'Full heads of clustered blooms'),
('Chrysanthemum',  'Classic fall favorite'),
('Iris',           'Distinctive bearded petals'),
('Lavender',       'Fragrant purple spikes'),
('Baby''s Breath', 'Light airy filler');

-- Type IDs
SET @ft_rose  := (SELECT flower_type_id FROM FlowerType WHERE name='Rose');
SET @ft_lily  := (SELECT flower_type_id FROM FlowerType WHERE name='Lily');
SET @ft_orch  := (SELECT flower_type_id FROM FlowerType WHERE name='Orchid');
SET @ft_carn  := (SELECT flower_type_id FROM FlowerType WHERE name='Carnation');
SET @ft_daisy := (SELECT flower_type_id FROM FlowerType WHERE name='Daisy');
SET @ft_hydra := (SELECT flower_type_id FROM FlowerType WHERE name='Hydrangea');
SET @ft_chry  := (SELECT flower_type_id FROM FlowerType WHERE name='Chrysanthemum');
SET @ft_iris  := (SELECT flower_type_id FROM FlowerType WHERE name='Iris');
SET @ft_lav   := (SELECT flower_type_id FROM FlowerType WHERE name='Lavender');
SET @ft_baby  := (SELECT flower_type_id FROM FlowerType WHERE name='Baby''s Breath');

-- =========================
-- PRODUCTS (10, one per type)
-- =========================
INSERT INTO FlowerProduct (name, description, flower_type_id, base_price, status, stock_quantity, created_at, updated_at) VALUES
('Red Rose Bouquet',       'A dozen red roses',               @ft_rose,  49.99, 'NewFlower', 120, NOW(), NOW()),
('White Lily Arrangement', 'Elegant lilies in a vase',        @ft_lily,  39.99, 'NewFlower',  80, NOW(), NOW()),
('Orchid Delight',         'Exotic orchid in a pot',          @ft_orch,  59.99, 'OldFlower',  40, NOW(), NOW()),
('Carnation Charm',        '12 pink carnations',              @ft_carn,  19.99, 'NewFlower', 200, NOW(), NOW()),
('Daisy Daylight',         '16 white daisies',                @ft_daisy, 18.99, 'NewFlower', 150, NOW(), NOW()),
('Hydrangea Hues',         '3 blue hydrangea stems',          @ft_hydra, 34.99, 'NewFlower',  90, NOW(), NOW()),
('Autumn Chrysanthemum',   '12 assorted chrysanthemums',      @ft_chry,  24.99, 'NewFlower', 130, NOW(), NOW()),
('Royal Iris',             '10 deep purple irises',           @ft_iris,  27.99, 'NewFlower', 110, NOW(), NOW()),
('Lavender Breeze',        'Dried lavender bouquet',          @ft_lav,   22.49, 'NewFlower', 160, NOW(), NOW()),
('Cloudy Gypsophila',      'Baby''s breath arrangement',      @ft_baby,  21.49, 'NewFlower', 170, NOW(), NOW());

-- Product IDs
SET @p_rose   := (SELECT product_id FROM FlowerProduct WHERE name='Red Rose Bouquet');
SET @p_lily   := (SELECT product_id FROM FlowerProduct WHERE name='White Lily Arrangement');
SET @p_orch   := (SELECT product_id FROM FlowerProduct WHERE name='Orchid Delight');
SET @p_carn   := (SELECT product_id FROM FlowerProduct WHERE name='Carnation Charm');
SET @p_daisy  := (SELECT product_id FROM FlowerProduct WHERE name='Daisy Daylight');
SET @p_hydra  := (SELECT product_id FROM FlowerProduct WHERE name='Hydrangea Hues');
SET @p_chry   := (SELECT product_id FROM FlowerProduct WHERE name='Autumn Chrysanthemum');
SET @p_iris   := (SELECT product_id FROM FlowerProduct WHERE name='Royal Iris');
SET @p_lav    := (SELECT product_id FROM FlowerProduct WHERE name='Lavender Breeze');
SET @p_baby   := (SELECT product_id FROM FlowerProduct WHERE name='Cloudy Gypsophila');

-- =========================
-- PRODUCT IMAGES (primary for each)
-- =========================
INSERT INTO ProductImage (product_id, image_url, alt_text, is_primary) VALUES
(@p_rose,  'https://example.com/rose.jpg',          'Red Rose Bouquet', TRUE),
(@p_lily,  'https://example.com/lily.jpg',          'White Lily Arrangement', TRUE),
(@p_orch,  'https://example.com/orchid.jpg',        'Orchid Delight', TRUE),
(@p_carn,  'https://example.com/carnation.jpg',     'Carnation Charm', TRUE),
(@p_daisy, 'https://example.com/daisy.jpg',         'Daisy Daylight', TRUE),
(@p_hydra, 'https://example.com/hydrangea.jpg',     'Hydrangea Hues', TRUE),
(@p_chry,  'https://example.com/chrysanthemum.jpg', 'Autumn Chrysanthemum', TRUE),
(@p_iris,  'https://example.com/iris.jpg',          'Royal Iris', TRUE),
(@p_lav,   'https://example.com/lavender.jpg',      'Lavender Breeze', TRUE),
(@p_baby,  'https://example.com/babysbreath.jpg',   'Cloudy Gypsophila', TRUE);

-- =========================
-- OCCASIONS (10) + LINKS
-- =========================
INSERT INTO Occasion (name) VALUES
('Birthday'),
('Valentine''s Day'),
('Anniversary'),
('Get Well'),
('Congratulations'),
('Sympathy'),
('New Baby'),
('Thank You'),
('Mother''s Day'),
('Graduation');

-- Link products to occasions
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_rose, occasion_id FROM Occasion WHERE name='Valentine''s Day';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_lily, occasion_id FROM Occasion WHERE name='Anniversary';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_orch, occasion_id FROM Occasion WHERE name='Congratulations';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_carn, occasion_id FROM Occasion WHERE name='Thank You';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_daisy, occasion_id FROM Occasion WHERE name='Get Well';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_hydra, occasion_id FROM Occasion WHERE name='Graduation';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_chry, occasion_id FROM Occasion WHERE name='Sympathy';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_iris,  occasion_id FROM Occasion WHERE name='Birthday';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_lav,   occasion_id FROM Occasion WHERE name='Mother''s Day';
INSERT INTO ProductOccasion (product_id, occasion_id)
SELECT @p_baby,  occasion_id FROM Occasion WHERE name='New Baby';

-- =========================
-- SPECIAL DAYS (4) + PRICING RULES (4)
-- =========================
INSERT INTO SpecialDay (name, start_date, end_date) VALUES
('Valentine''s Day Offer', '2025-02-10', '2025-02-14'),
('Spring Bloom Sale',      '2025-03-20', '2025-03-27'),
('Mother''s Day Campaign', '2025-05-08', '2025-05-12'),
('Lunar New Year Flowers', '2025-01-28', '2025-02-04');

SET @sd_val   := (SELECT special_day_id FROM SpecialDay WHERE name='Valentine''s Day Offer');
SET @sd_spr   := (SELECT special_day_id FROM SpecialDay WHERE name='Spring Bloom Sale');
SET @sd_mom   := (SELECT special_day_id FROM SpecialDay WHERE name='Mother''s Day Campaign');
SET @sd_lny   := (SELECT special_day_id FROM SpecialDay WHERE name='Lunar New Year Flowers');

INSERT INTO PricingRule (
  rule_name, priority, is_active, adjustment_type, adjustment_value,
  applicable_product_id, applicable_flower_type_id, applicable_product_status,
  time_of_day_start, time_of_day_end, special_day_id, valid_from, valid_to
) VALUES
('Valentine Rose Discount', 10, TRUE, 'percentage_discount', 15.00,
 @p_rose, NULL, 'NewFlower', '00:00:00', '23:59:59', @sd_val, '2025-08-17 00:00:00', '2025-08-27 23:59:59'),
('Spring Hydrangea -15% Morning', 20, TRUE, 'percentage_discount', 15.00,
 NULL, @ft_hydra, NULL, '00:00:00', '23:59:59', @sd_spr, '2025-03-20 00:00:00', '2025-08-27 23:59:59'),
('Mother''s Day Lavender -$5', 25, TRUE, 'fixed_discount', 5.00,
 @p_lav, NULL, NULL, '00:00:00', '23:59:59', @sd_mom, '2025-08-20 00:00:00', '2025-09-05 23:59:59'),
('LNY Carnation -$3', 30, TRUE, 'fixed_discount', 3.00,
 NULL, @ft_carn, NULL, '00:00:00', '23:59:59', @sd_lny, '2025-03-21 00:00:00', '2025-10-05 23:59:59');

-- =========================
-- CARTS & ITEMS
-- =========================
INSERT INTO Cart (firebase_uid, session_id, created_at, updated_at) VALUES
(@uid_john,   'sess_john_001',   NOW(), NOW()),
(@uid_mary,   'sess_mary_001',   NOW(), NOW()),
(@uid_tom,    'sess_tom_001',    NOW(), NOW()),
(@uid_li,     'sess_li_001',     NOW(), NOW()),
(@uid_fatima, 'sess_fatima_001', NOW(), NOW()),
(@uid_carlos, 'sess_carlos_001', NOW(), NOW()),
(@uid_anna,   'sess_anna_001',   NOW(), NOW()),
(@uid_peter,  'sess_peter_001',  NOW(), NOW()),
(@uid_sara,   'sess_sara_001',   NOW(), NOW());

-- Cart ids
SET @cart_john   := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_john   AND session_id='sess_john_001');
SET @cart_mary   := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_mary   AND session_id='sess_mary_001');
SET @cart_tom    := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_tom    AND session_id='sess_tom_001');
SET @cart_li     := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_li     AND session_id='sess_li_001');
SET @cart_fatima := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_fatima AND session_id='sess_fatima_001');
SET @cart_carlos := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_carlos AND session_id='sess_carlos_001');
SET @cart_anna   := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_anna   AND session_id='sess_anna_001');
SET @cart_peter  := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_peter  AND session_id='sess_peter_001');
SET @cart_sara   := (SELECT cart_id FROM Cart WHERE firebase_uid=@uid_sara   AND session_id='sess_sara_001');

INSERT INTO CartItem (cart_id, product_id, quantity, added_at) VALUES
(@cart_john,   @p_rose,  2, NOW()),
(@cart_mary,   @p_hydra, 1, NOW()),
(@cart_mary,   @p_lav,   2, NOW()),
(@cart_tom,    @p_carn,  2, NOW()),
(@cart_li,     @p_iris,  1, NOW()),
(@cart_fatima, @p_chry,  3, NOW()),
(@cart_carlos, @p_daisy, 2, NOW()),
(@cart_anna,   @p_baby,  1, NOW()),
(@cart_peter,  @p_lav,   2, NOW()),
(@cart_sara,   @p_iris,  1, NOW());

-- =========================
-- ORDERS, ITEMS, PAYMENTS
-- =========================

-- John (Completed)
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_john, 'john@example.com', 'John Doe', @addr_john_ship, @addr_john_bill,
 NOW(), 'Completed', 99.98, 15.00, 5.00, 89.98, 'Standard', 'Please deliver before noon.');
SET @order_john := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_john, @p_rose, 2, 42.49, 84.98);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_john, 'Paypal', 'Success', 'txn_john_001', 89.98, NOW());

-- Mary (Completed)
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_mary, 'mary@example.com', 'Mary Jones', @addr_mary_ship, @addr_mary_bill,
 NOW(), 'Completed', 79.47, 5.00, 6.00, 80.47, 'Express', 'Call on arrival');
SET @order_mary := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_mary, @p_lav,   2, 22.49, 44.98),
(@order_mary, @p_hydra, 1, 34.49, 34.49);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_mary, 'Card', 'Success', 'txn_mary_001', 80.47, NOW());

-- Tom (Cancelled)
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_tom, 'tom@example.com', 'Tom Nguyen', @addr_tom_ship, @addr_tom_bill,
 NOW(), 'Cancelled', 39.98, 0.00, 5.00, 44.98, 'Standard', 'Changed mind');
SET @order_tom := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_tom, @p_carn, 2, 19.99, 39.98);

-- Li (Pending; same address for ship/bill)
SET @addr_li := (SELECT address_id FROM Address WHERE firebase_uid=@uid_li AND is_default_shipping=TRUE LIMIT 1);
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_li, 'liwei@example.com', 'Li Wei', @addr_li, @addr_li,
 NOW(), 'Pending', 27.99, 0.00, 4.00, 31.99, 'Standard', 'Deliver this week');
SET @order_li := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_li, @p_iris, 1, 27.99, 27.99);

-- Fatima (Completed)
SET @addr_fatima := (SELECT address_id FROM Address WHERE firebase_uid=@uid_fatima AND is_default_shipping=TRUE LIMIT 1);
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_fatima, 'fatima@example.com', 'Fatima Khan', @addr_fatima, @addr_fatima,
 NOW(), 'Completed', 74.97, 0.00, 6.00, 80.97, 'Express', 'Leave with reception');
SET @order_fatima := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_fatima, @p_chry, 3, 24.99, 74.97);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_fatima, 'Paypal', 'Success', 'txn_fatima_001', 80.97, NOW());

-- Carlos (Completed)
SET @addr_carlos := (SELECT address_id FROM Address WHERE firebase_uid=@uid_carlos AND is_default_shipping=TRUE LIMIT 1);
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_carlos, 'carlos@example.com', 'Carlos Hernandez', @addr_carlos, @addr_carlos,
 NOW(), 'Completed', 37.98, 0.00, 5.00, 42.98, 'Standard', 'Evening delivery');
SET @order_carlos := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_carlos, @p_daisy, 2, 18.99, 37.98);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_carlos, 'Card', 'Success', 'txn_carlos_001', 42.98, NOW());

-- Anna (Completed)
SET @addr_anna := (SELECT address_id FROM Address WHERE firebase_uid=@uid_anna AND is_default_shipping=TRUE LIMIT 1);
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_anna, 'anna@example.com', 'Anna Kovacs', @addr_anna, @addr_anna,
 NOW(), 'Completed', 21.49, 0.00, 4.00, 25.49, 'Standard', 'Front desk');
SET @order_anna := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_anna, @p_baby, 1, 21.49, 21.49);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_anna, 'Card', 'Success', 'txn_anna_001', 25.49, NOW());

-- Peter (Pending)
SET @addr_peter := (SELECT address_id FROM Address WHERE firebase_uid=@uid_peter AND is_default_shipping=TRUE LIMIT 1);
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_peter, 'peter@example.com', 'Peter Owens', @addr_peter, @addr_peter,
 NOW(), 'Pending', 44.98, 5.00, 6.00, 45.98, 'Express', 'Office hours');
SET @order_peter := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_peter, @p_hydra, 1, 34.99, 34.99),
(@order_peter, @p_lav,   1, 10.00, 10.00);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_peter, 'Card', 'Success', 'txn_peter_001', 45.98, NOW());

-- Sara (Pending)
SET @addr_sara := (SELECT address_id FROM Address WHERE firebase_uid=@uid_sara AND is_default_shipping=TRUE LIMIT 1);
INSERT INTO `Order` (
  firebase_uid, customer_email, customer_name, shipping_address_id, billing_address_id,
  order_date, status, subtotal_amount, discount_amount, shipping_cost,
  final_total_amount, shipping_method, notes
) VALUES
(@uid_sara, 'sara@example.com', 'Sara Lee', @addr_sara, @addr_sara,
 NOW(), 'Pending', 27.99, 0.00, 4.00, 2000.99, 'Standard', 'Leave at door');
SET @order_sara := LAST_INSERT_ID();
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal) VALUES
(@order_sara, @p_iris, 1, 27.99, 27.99);
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date) VALUES
(@order_sara, 'Card', 'Success', 'txn_sara_001', 2000.99, NOW());

-- =========================
-- LOYALTY PROGRAMS & TRANSACTIONS
-- =========================
INSERT INTO LoyaltyProgram (firebase_uid, points_balance, last_updated) VALUES
(@uid_john,   200, NOW()),
(@uid_mary,   350, NOW()),
(@uid_tom,    100, NOW()),
(@uid_li,      80, NOW()),
(@uid_fatima, 120, NOW()),
(@uid_carlos,  60, NOW()),
(@uid_anna,    90, NOW()),
(@uid_peter,   70, NOW()),
(@uid_sara,    50, NOW());

SET @loy_john   := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_john);
SET @loy_mary   := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_mary);
SET @loy_tom    := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_tom);
SET @loy_li     := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_li);
SET @loy_fatima := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_fatima);
SET @loy_carlos := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_carlos);
SET @loy_anna   := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_anna);
SET @loy_peter  := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_peter);
SET @loy_sara   := (SELECT loyalty_id FROM LoyaltyProgram WHERE firebase_uid=@uid_sara);

INSERT INTO LoyaltyTransaction (loyalty_id, order_id, points_change, reason, transaction_date) VALUES
(@loy_john,   @order_john,   50, 'Order Purchase', NOW()),
(@loy_mary,   @order_mary,   80, 'Order Purchase', NOW()),
(@loy_tom,    @order_tom,   -20, 'Order Cancelled', NOW()),
(@loy_li,     @order_li,     25, 'Order Purchase', NOW()),
(@loy_fatima, @order_fatima, 30, 'Order Purchase', NOW()),
(@loy_carlos, @order_carlos, 15, 'Order Purchase', NOW()),
(@loy_anna,   @order_anna,   10, 'Order Purchase', NOW()),
(@loy_peter,  @order_peter,  12, 'Order Purchase', NOW()),
(@loy_sara,   @order_sara,   10, 'Order Purchase', NOW());

-- =========================
-- REVIEWS
-- =========================
INSERT INTO Review (product_id, firebase_uid, rating, comment, review_date) VALUES
(@p_rose,  @uid_john,  5, 'Beautiful bouquet and fast delivery!', NOW()),
(@p_lav,   @uid_mary,  4, 'Lovely scent, will buy again.', NOW()),
(@p_chry,  @uid_fatima,5, 'Fresh and vibrant colors.', NOW()),
(@p_daisy, @uid_carlos,3, 'Nice but stems were short.', NOW()),
(@p_hydra, @uid_peter, 5, 'Hydrangeas were stunning!', NOW()),
(@p_baby,  @uid_anna,  5, 'Delicate and beautiful arrangement.', NOW()),
(@p_carn,  @uid_tom,   4, 'Great value for the price.', NOW()),
(@p_iris,  @uid_sara,  4, 'Deep purple color looked amazing.', NOW()),
(@p_lily,  @uid_mary,  5, 'Elegant lilies, perfect gift.', NOW());

-- =========================
-- USER PRODUCT INTERACTIONS
-- (interaction_type suggested: 'view','add_to_cart','wishlist_add')
-- =========================
INSERT INTO UserProductInteraction (firebase_uid, session_id, product_id, interaction_type, timestamp) VALUES
(@uid_john,   'sess_john_001',  @p_rose,  'view',         NOW()),
(@uid_john,   'sess_john_001',  @p_rose,  'add_to_cart',  NOW()),
(@uid_mary,   'sess_mary_001',  @p_hydra, 'view',         NOW()),
(@uid_mary,   'sess_mary_001',  @p_lav,   'add_to_cart',  NOW()),
(@uid_tom,    'sess_tom_001',   @p_carn,  'view',         NOW()),
(@uid_li,     'sess_li_001',    @p_iris,  'view',         NOW()),
(@uid_fatima, 'sess_fatima_001',@p_chry,  'view',         NOW()),
(@uid_peter,  'sess_peter_001', @p_hydra, 'view',         NOW()),
(@uid_anna,   'sess_anna_001',  @p_baby,  'wishlist_add', NOW()),
(@uid_sara,   'sess_sara_001',  @p_iris,  'add_to_cart',  NOW());



