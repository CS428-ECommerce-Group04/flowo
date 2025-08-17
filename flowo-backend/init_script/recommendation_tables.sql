-- Recommendation System Database Tables
-- Add these tables to support the recommendation engine

-- Table: UserPreference
-- Stores learned user preferences for personalized recommendations
CREATE TABLE IF NOT EXISTS UserPreference (
    firebase_uid VARCHAR(255) PRIMARY KEY,
    flower_preferences JSON COMMENT 'JSON object storing flower type preferences with scores',
    occasion_preferences JSON COMMENT 'JSON object storing occasion preferences with scores',
    price_min DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'User preferred minimum price',
    price_max DECIMAL(10, 2) DEFAULT 999.99 COMMENT 'User preferred maximum price',
    average_spent DECIMAL(10, 2) DEFAULT 0.00 COMMENT 'User average spending per order',
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid) ON DELETE CASCADE,
    INDEX idx_user_preferences_updated (last_updated)
);

-- Table: ProductSimilarity
-- Stores precomputed product similarity scores for fast retrieval
CREATE TABLE IF NOT EXISTS ProductSimilarity (
    product_id_1 INT,
    product_id_2 INT,
    similarity_score DECIMAL(5, 4) NOT NULL COMMENT 'Similarity score between 0.0000 and 1.0000',
    similarity_type VARCHAR(50) DEFAULT 'content' COMMENT 'Type of similarity: content, collaborative, hybrid',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id_1, product_id_2),
    FOREIGN KEY (product_id_1) REFERENCES FlowerProduct(product_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id_2) REFERENCES FlowerProduct(product_id) ON DELETE CASCADE,
    INDEX idx_similarity_score (similarity_score DESC),
    INDEX idx_similarity_type (similarity_type),
    INDEX idx_similarity_updated (updated_at),
    CHECK (similarity_score >= 0.0000 AND similarity_score <= 1.0000),
    CHECK (product_id_1 != product_id_2)
);

-- Table: TrendingProduct
-- Stores trending product data for different time periods
CREATE TABLE IF NOT EXISTS TrendingProduct (
    product_id INT,
    trend_score DECIMAL(5, 4) NOT NULL COMMENT 'Trending score between 0.0000 and 1.0000',
    view_count INT DEFAULT 0 COMMENT 'Number of views in the period',
    purchase_count INT DEFAULT 0 COMMENT 'Number of purchases in the period',
    period VARCHAR(20) NOT NULL COMMENT 'Time period: daily, weekly, monthly',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, period),
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id) ON DELETE CASCADE,
    INDEX idx_trending_score (trend_score DESC),
    INDEX idx_trending_period (period),
    INDEX idx_trending_updated (updated_at),
    CHECK (trend_score >= 0.0000 AND trend_score <= 1.0000),
    CHECK (period IN ('daily', 'weekly', 'monthly'))
);

-- Table: RecommendationFeedback
-- Tracks user interactions with recommendations for learning and analytics
CREATE TABLE IF NOT EXISTS RecommendationFeedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    firebase_uid VARCHAR(255),
    product_id INT,
    recommendation_type VARCHAR(50) NOT NULL COMMENT 'Type of recommendation that led to this action',
    action VARCHAR(50) NOT NULL COMMENT 'User action: clicked, purchased, dismissed, liked',
    session_id VARCHAR(255) COMMENT 'Session ID for anonymous users',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (firebase_uid) REFERENCES User(firebase_uid) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES FlowerProduct(product_id) ON DELETE CASCADE,
    INDEX idx_feedback_user (firebase_uid),
    INDEX idx_feedback_product (product_id),
    INDEX idx_feedback_type (recommendation_type),
    INDEX idx_feedback_action (action),
    INDEX idx_feedback_created (created_at),
    CHECK (action IN ('clicked', 'purchased', 'dismissed', 'liked'))
);

-- Table: RecommendationCache
-- Optional: Cache frequently requested recommendations for performance
CREATE TABLE IF NOT EXISTS RecommendationCache (
    cache_key VARCHAR(255) PRIMARY KEY,
    firebase_uid VARCHAR(255),
    recommendation_type VARCHAR(50),
    recommendations JSON COMMENT 'Cached recommendation results as JSON',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cache_user (firebase_uid),
    INDEX idx_cache_type (recommendation_type),
    INDEX idx_cache_expires (expires_at),
    INDEX idx_cache_created (created_at)
);

-- Add indexes to existing tables for better recommendation performance

-- Index on UserProductInteraction for faster user behavior analysis
CREATE INDEX idx_user_interaction_user_type 
ON UserProductInteraction(firebase_uid, interaction_type);

CREATE INDEX idx_user_interaction_product_type 
ON UserProductInteraction(product_id, interaction_type);

CREATE INDEX idx_user_interaction_timestamp 
ON UserProductInteraction(timestamp DESC);

-- Index on Review for recommendation scoring
CREATE INDEX idx_review_product_rating 
ON Review(product_id, rating);

CREATE INDEX idx_review_user_rating 
ON Review(firebase_uid, rating);

-- Index on Order and OrderItem for purchase history analysis
CREATE INDEX idx_order_user_status_date 
ON `Order`(firebase_uid, status, order_date DESC);

CREATE INDEX idx_order_item_product 
ON OrderItem(product_id, quantity);

-- Index on FlowerProduct for content-based filtering
CREATE INDEX idx_product_flower_type_price 
ON FlowerProduct(flower_type_id, base_price);

CREATE INDEX idx_product_status_stock 
ON FlowerProduct(status, stock_quantity);

-- Insert some sample data for testing (optional)

-- Sample flower type preferences for testing
INSERT IGNORE INTO UserPreference (firebase_uid, flower_preferences, occasion_preferences, price_min, price_max, average_spent) VALUES
('user1', '{"Rose": 0.9, "Lily": 0.7, "Tulip": 0.5}', '{"Valentine''s Day": 0.9, "Birthday": 0.6}', 20.00, 100.00, 45.50),
('user2', '{"Orchid": 0.8, "Sunflower": 0.6}', '{"Anniversary": 0.8, "Mother''s Day": 0.7}', 15.00, 80.00, 35.00);

-- Sample trending products (this would typically be generated by background jobs)
INSERT IGNORE INTO TrendingProduct (product_id, trend_score, view_count, purchase_count, period) VALUES
(1, 0.95, 150, 25, 'weekly'),
(2, 0.87, 120, 20, 'weekly'),
(3, 0.76, 100, 15, 'weekly'),
(1, 0.92, 50, 8, 'daily'),
(2, 0.84, 45, 7, 'daily');

-- Performance optimization: Create composite indexes for common queries
CREATE INDEX idx_trending_period_score 
ON TrendingProduct(period, trend_score DESC);

CREATE INDEX idx_similarity_product1_score 
ON ProductSimilarity(product_id_1, similarity_score DESC);

CREATE INDEX idx_similarity_product2_score 
ON ProductSimilarity(product_id_2, similarity_score DESC);

-- Add constraints for data integrity
ALTER TABLE TrendingProduct 
ADD CONSTRAINT chk_trending_counts 
CHECK (view_count >= 0 AND purchase_count >= 0 AND purchase_count <= view_count);

-- Create a view for easy access to product popularity metrics
CREATE OR REPLACE VIEW ProductPopularityView AS
SELECT 
    fp.product_id,
    fp.name,
    fp.base_price,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.review_id) as review_count,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COUNT(DISTINCT o.firebase_uid) as unique_buyers,
    COALESCE(SUM(upi.interaction_count), 0) as total_views
FROM FlowerProduct fp
LEFT JOIN Review r ON fp.product_id = r.product_id
LEFT JOIN OrderItem oi ON fp.product_id = oi.product_id
LEFT JOIN `Order` o ON oi.order_id = o.order_id AND o.status = 'Completed'
LEFT JOIN (
    SELECT product_id, COUNT(*) as interaction_count
    FROM UserProductInteraction 
    WHERE interaction_type = 'view'
    GROUP BY product_id
) upi ON fp.product_id = upi.product_id
GROUP BY fp.product_id, fp.name, fp.base_price;

-- Create stored procedure for updating trending products (optional)
DROP PROCEDURE IF EXISTS UpdateTrendingProducts;
DELIMITER //
CREATE PROCEDURE UpdateTrendingProducts(IN period_type VARCHAR(20))
BEGIN
    DECLARE days_back INT DEFAULT 7;
    
    -- Set the number of days based on period type
    CASE period_type
        WHEN 'daily' THEN SET days_back = 1;
        WHEN 'weekly' THEN SET days_back = 7;
        WHEN 'monthly' THEN SET days_back = 30;
        ELSE SET days_back = 7;
    END CASE;
    
    -- Update trending products based on recent activity
    INSERT INTO TrendingProduct (product_id, trend_score, view_count, purchase_count, period)
    SELECT 
        p.product_id,
        -- Calculate trend score based on views, purchases, and ratings
        LEAST(1.0, (
            COALESCE(view_data.view_count, 0) * 0.3 +
            COALESCE(purchase_data.purchase_count, 0) * 10 * 0.5 +
            COALESCE(p.avg_rating, 0) / 5.0 * 0.2
        ) / 100.0) as trend_score,
        COALESCE(view_data.view_count, 0) as view_count,
        COALESCE(purchase_data.purchase_count, 0) as purchase_count,
        period_type as period
    FROM ProductPopularityView p
    LEFT JOIN (
        SELECT product_id, COUNT(*) as view_count
        FROM UserProductInteraction
        WHERE interaction_type = 'view' 
        AND timestamp >= DATE_SUB(NOW(), INTERVAL days_back DAY)
        GROUP BY product_id
    ) view_data ON p.product_id = view_data.product_id
    LEFT JOIN (
        SELECT oi.product_id, SUM(oi.quantity) as purchase_count
        FROM OrderItem oi
        JOIN `Order` o ON oi.order_id = o.order_id
        WHERE o.status = 'Completed'
        AND o.order_date >= DATE_SUB(NOW(), INTERVAL days_back DAY)
        GROUP BY oi.product_id
    ) purchase_data ON p.product_id = purchase_data.product_id
    WHERE COALESCE(view_data.view_count, 0) > 0 
       OR COALESCE(purchase_data.purchase_count, 0) > 0
    ON DUPLICATE KEY UPDATE
        trend_score = VALUES(trend_score),
        view_count = VALUES(view_count),
        purchase_count = VALUES(purchase_count),
        updated_at = CURRENT_TIMESTAMP;
END //
DELIMITER ;

-- Create event scheduler to automatically update trending products (optional)
-- Note: This requires the event scheduler to be enabled
SET GLOBAL event_scheduler = ON;

CREATE EVENT UpdateDailyTrending
ON SCHEDULE EVERY 1 HOUR
DO CALL UpdateTrendingProducts('daily');

CREATE EVENT UpdateWeeklyTrending
ON SCHEDULE EVERY 6 HOUR
DO CALL UpdateTrendingProducts('weekly');

CREATE EVENT UpdateMonthlyTrending
ON SCHEDULE EVERY 1 DAY
DO CALL UpdateTrendingProducts('monthly');