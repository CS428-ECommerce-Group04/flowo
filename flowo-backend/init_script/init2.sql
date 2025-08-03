
USE flowo_db;
-- Sample Users
INSERT INTO User (firebase_uid, username, email, full_name, gender, role, created_at, updated_at)
VALUES
('firebase_uid_john_doe', 'john_doe', 'john@example.com', 'John Doe', 'Male', 'RegisteredBuyer', NOW(), NOW()),
('firebase_uid_admin_user', 'admin_user', 'admin@example.com', 'Admin User', 'Other', 'Admin', NOW(), NOW());

-- Sample Addresses
INSERT INTO Address (user_id, recipient_name, phone_number, street_address, city, postal_code, country, is_default_shipping)
VALUES
(1, 'John Doe', '1234567890', '123 Flower Street', 'New York', '10001', 'USA', TRUE),
(1, 'John Doe', '1234567890', '456 Bloom Ave', 'New York', '10001', 'USA', FALSE);

-- Sample Flower Types
INSERT INTO FlowerType (name, description)
VALUES
('Rose', 'Classic romantic flower'),
('Lily', 'Elegant and fragrant'),
('Orchid', 'Exotic and delicate');

-- Sample Flower Products
INSERT INTO FlowerProduct (name, description, flower_type_id, base_price, status, stock_quantity, created_at, updated_at)
VALUES
('Red Rose Bouquet', 'A dozen red roses', 1, 49.99, 'NewFlower', 100, NOW(), NOW()),
('White Lily Arrangement', 'Elegant lilies in a vase', 2, 39.99, 'NewFlower', 50, NOW(), NOW()),
('Orchid Delight', 'Exotic orchid in a pot', 3, 59.99, 'OldFlower', 30, NOW(), NOW());

-- Sample Product Images
INSERT INTO ProductImage (product_id, image_url, alt_text, is_primary)
VALUES
(1, 'https://example.com/rose.jpg', 'Red Rose Bouquet', TRUE),
(2, 'https://example.com/lily.jpg', 'White Lily Arrangement', TRUE),
(3, 'https://example.com/orchid.jpg', 'Orchid Delight', TRUE);

-- Sample Occasions
INSERT INTO Occasion (name)
VALUES
('Birthday'),
('Valentine''s Day'),
('Anniversary');

-- Sample ProductOccasion Links
INSERT INTO ProductOccasion (product_id, occasion_id)
VALUES
(1, 2),
(2, 1),
(3, 3);

-- Sample Special Day
INSERT INTO SpecialDay (name, start_date, end_date)
VALUES
('Valentine''s Day Offer', '2025-02-10', '2025-02-14');

-- Sample Pricing Rule
INSERT INTO PricingRule (
    rule_name, priority, is_active, adjustment_type, adjustment_value,
    applicable_product_id, applicable_flower_type_id, applicable_product_status,
    time_of_day_start, time_of_day_end, special_day_id, valid_from, valid_to
)
VALUES
('Valentine Rose Discount', 10, TRUE, 'percentage_discount', 15.00, 1, NULL, 'NewFlower',
 '08:00:00', '20:00:00', 1, '2025-02-10 00:00:00', '2025-02-14 23:59:59');

-- Sample Cart
INSERT INTO Cart (user_id, session_id, created_at, updated_at)
VALUES
(1, 'sess_abc123', NOW(), NOW());

-- Sample Cart Items
INSERT INTO CartItem (cart_id, product_id, quantity, added_at)
VALUES
(1, 1, 2, NOW());

-- Sample Order
INSERT INTO `Order` (
    user_id, customer_email, customer_name, shipping_address_id, billing_address_id,
    order_date, status, subtotal_amount, discount_amount, shipping_cost,
    final_total_amount, shipping_method, notes
)
VALUES
(1, 'john@example.com', 'John Doe', 1, 2, NOW(), 'Completed', 99.98, 15.00, 5.00, 89.98, 'Standard', 'Please deliver before noon.');

-- Sample Order Item
INSERT INTO OrderItem (order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal)
VALUES
(1, 1, 2, 42.49, 84.98);

-- Sample Payment
INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date)
VALUES
(1, 'Paypal', 'Success', 'txn_987654321', 89.98, NOW());

-- Sample Loyalty Program
INSERT INTO LoyaltyProgram (user_id, points_balance, last_updated)
VALUES
(1, 200, NOW());

-- Sample Loyalty Transaction
INSERT INTO LoyaltyTransaction (loyalty_id, order_id, points_change, reason, transaction_date)
VALUES
(1, 1, 50, 'Order Purchase', NOW());

-- Sample Review
INSERT INTO Review (product_id, user_id, rating, comment, review_date)
VALUES
(1, 1, 5, 'Beautiful bouquet and fast delivery!', NOW());

-- Sample User Product Interaction
INSERT INTO UserProductInteraction (user_id, session_id, product_id, interaction_type, timestamp)
VALUES
(1, 'sess_abc123', 1, 'view', NOW()),
(1, 'sess_abc123', 1, 'add_to_cart', NOW());

-- Sample Reviews 
INSERT INTO Review (product_id, user_id, rating, comment, review_date)
VALUES (1, 1, 5, 'The product is very beautiful', NOW());

ALTER TABLE PricingRule
MODIFY COLUMN valid_from TIMESTAMP NULL DEFAULT NULL,
MODIFY COLUMN valid_to TIMESTAMP NULL DEFAULT NULL;
