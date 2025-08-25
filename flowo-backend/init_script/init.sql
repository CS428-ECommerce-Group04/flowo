CREATE DATABASE IF NOT EXISTS flowo_db;
USE flowo_db;

CREATE TABLE IF NOT EXISTS todos (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: User
CREATE TABLE User (
    firebase_uid VARCHAR(255) PRIMARY KEY COMMENT 'Firebase User UID for linking with Firebase Auth',
    username VARCHAR(255) UNIQUE COMMENT 'Optional local username',
    email VARCHAR(255) UNIQUE NOT NULL COMMENT 'User email address (cached from Firebase)',
    full_name VARCHAR(255) COMMENT 'User display name (cached from Firebase)',
    gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Other',
    role ENUM('RegisteredBuyer', 'Admin') NOT NULL DEFAULT 'RegisteredBuyer' COMMENT "('RegisteredBuyer', 'Admin')",
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Table: Address
CREATE TABLE Address (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255),
    recipient_name VARCHAR(255),
    phone_number VARCHAR(50),
    street_address VARCHAR(255),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    is_default_shipping BOOLEAN COMMENT 'Default shipping for user',
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid)
);

-- Table: FlowerType
CREATE TABLE FlowerType (
    flower_type_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE COMMENT 'e.g., Rose, Lily, Orchid',
    description TEXT COMMENT 'Optional description'
);

-- Table: FlowerProduct
CREATE TABLE FlowerProduct (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255),
    description TEXT,
    flower_type_id INT,
    base_price DECIMAL(10, 2) COMMENT 'Base price before dynamic adjustments',
    status VARCHAR(50) COMMENT "('NewFlower', 'OldFlower', 'LowStock')",
    stock_quantity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flower_type_id) REFERENCES FlowerType(flower_type_id)
);

-- Table: ProductImage
CREATE TABLE ProductImage (
    image_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    image_url VARCHAR(512),
    alt_text VARCHAR(255) COMMENT 'For accessibility',
    is_primary BOOLEAN COMMENT 'Indicates the main image',
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id)
);

-- Table: Occasion
CREATE TABLE Occasion (
    occasion_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE COMMENT "e.g., Birthday, Valentine's Day, Anniversary"
);

-- Table: ProductOccasion
CREATE TABLE ProductOccasion (
    product_id INT,
    occasion_id INT,
    PRIMARY KEY (product_id, occasion_id),
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id),
    FOREIGN KEY (occasion_id) REFERENCES Occasion(occasion_id)
);

-- Table: Review
CREATE TABLE Review (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT,
    firebase_uid VARCHAR(255),
    rating INT COMMENT 'Integer rating, e.g., 1-5',
    comment TEXT COMMENT "User's review text",
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id),
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid)
);

-- Table: SpecialDay
CREATE TABLE SpecialDay (
    special_day_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE COMMENT "e.g., Valentine's Day Offer, Women's Day Sale",
    start_date DATE,
    end_date DATE
);

-- Table: PricingRule
CREATE TABLE PricingRule (
    rule_id INT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(255) COMMENT 'Descriptive name for the rule',
    priority INT COMMENT 'Order of application if multiple rules match (higher wins)',
    is_active BOOLEAN,
    adjustment_type VARCHAR(50) COMMENT "('percentage_discount', 'fixed_discount', 'override_price')",
    adjustment_value DECIMAL(10, 2),
    applicable_product_id INT,
    applicable_flower_type_id INT,
    applicable_product_status VARCHAR(50) COMMENT "('NewFlower', 'OldFlower') Optional: Condition for product status",
    time_of_day_start TIME,
    time_of_day_end TIME,
    special_day_id INT,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    FOREIGN KEY (applicable_product_id) REFERENCES FlowerProduct(product_id),
    FOREIGN KEY (applicable_flower_type_id) REFERENCES FlowerType(flower_type_id),
    FOREIGN KEY (special_day_id) REFERENCES SpecialDay(special_day_id)
);

-- Table: Cart
CREATE TABLE Cart (
    cart_id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255),
    session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid)
);

-- Table: CartItem
CREATE TABLE CartItem (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    cart_id INT,
    product_id INT,
    quantity INT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when item was added to cart',
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id),
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id)
);

-- Table: Order
CREATE TABLE `Order` (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255),
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    shipping_address_id INT,
    billing_address_id INT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) COMMENT "('Processing', 'AwaitingPayment', 'PaymentFailed', 'Delivering', 'Completed', 'Cancelled', 'Refunded', 'COMPLETED', 'CANCELLED')",
    subtotal_amount DECIMAL(10, 2),
    discount_amount DECIMAL(10, 2),
    shipping_cost DECIMAL(10, 2),
    final_total_amount DECIMAL(10, 2),
    shipping_method VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid),
    FOREIGN KEY (shipping_address_id) REFERENCES Address(address_id),
    FOREIGN KEY (billing_address_id) REFERENCES Address(address_id)
);

-- Table: OrderItem
CREATE TABLE OrderItem (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    product_id INT,
    quantity INT,
    price_per_unit_at_purchase DECIMAL(10, 2),
    item_subtotal DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id),
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id)
);

-- Table: Payment
CREATE TABLE Payment (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT,
    payment_method VARCHAR(50) COMMENT "('COD', 'Paypal', 'VNPAY', 'PayOS')",
    payment_status VARCHAR(50) COMMENT "('Pending', 'Completed', 'Cancelled', 'Success', 'Failed', 'Refunded')",
    transaction_id VARCHAR(255),
    payment_link_id VARCHAR(255) NULL,
    checkout_url VARCHAR(512) NULL,
    raw_webhook TEXT NULL,
    amount_paid DECIMAL(10, 2),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id),
    INDEX idx_payment_txn (transaction_id),
    INDEX idx_payment_link (payment_link_id)
);

-- Table: LoyaltyProgram
CREATE TABLE LoyaltyProgram (
    loyalty_id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255) UNIQUE,
    points_balance INT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid)
);

-- Table: LoyaltyTransaction
CREATE TABLE LoyaltyTransaction (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    loyalty_id INT,
    order_id INT,
    points_change INT COMMENT 'Positive for earned, negative for spent',
    reason VARCHAR(255) COMMENT "e.g., 'Order Purchase', 'Promotional Bonus', 'Points Redemption'",
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loyalty_id) REFERENCES LoyaltyProgram(loyalty_id),
    FOREIGN KEY (order_id) REFERENCES `Order`(order_id)
);

-- Table: UserProductInteraction
CREATE TABLE UserProductInteraction (
    interaction_id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255),
    session_id VARCHAR(255),
    product_id INT,
    interaction_type VARCHAR(50) COMMENT "('view', 'add_to_cart', 'wishlist_add')",
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid),
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id)
);

-- Add is_active column to FlowerProduct
ALTER TABLE FlowerProduct 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE User ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

