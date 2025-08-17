package repository

import (
	"database/sql"
	"flowo-backend/internal/model"
	"fmt"
	"strings"
	"time"
)

type RecommendationRepository interface {
	// User interactions and preferences
	GetUserInteractions(firebaseUID string) ([]model.UserInteractionSummary, error)
	GetUserPreferences(firebaseUID string) (*model.UserPreference, error)
	SaveUserPreferences(pref *model.UserPreference) error

	// Product similarities
	GetProductSimilarities(productID uint, limit int) ([]model.ProductSimilarity, error)
	SaveProductSimilarity(similarity *model.ProductSimilarity) error

	// Trending data
	GetTrendingProducts(period string, limit int) ([]model.TrendingProduct, error)
	UpdateTrendingProducts(products []model.TrendingProduct) error

	// User behavior tracking
	GetUserPurchaseHistory(firebaseUID string) ([]model.Product, error)
	GetUserCartHistory(firebaseUID string) ([]model.Product, error)
	GetUserViewHistory(firebaseUID string, limit int) ([]model.Product, error)

	// Collaborative filtering data
	GetSimilarUsers(firebaseUID string, limit int) ([]string, error)
	GetUsersWhoAlsoBought(productID uint, limit int) ([]string, error)

	// Content-based filtering data
	GetProductsByFlowerType(flowerType string, excludeProductID uint, limit int) ([]model.Product, error)
	GetProductsByOccasion(occasion string, excludeProductID uint, limit int) ([]model.Product, error)
	GetProductsByPriceRange(minPrice, maxPrice float64, excludeProductID uint, limit int) ([]model.Product, error)

	// Analytics and feedback
	SaveRecommendationFeedback(firebaseUID string, productID uint, recommendationType, action string) error
	GetRecommendationStats(period string) (map[string]interface{}, error)
}

type recommendationRepository struct {
	db *sql.DB
}

func NewRecommendationRepository(db *sql.DB) RecommendationRepository {
	return &recommendationRepository{db: db}
}

// GetUserInteractions retrieves aggregated user interactions
func (r *recommendationRepository) GetUserInteractions(firebaseUID string) ([]model.UserInteractionSummary, error) {
	query := `
		SELECT 
			upi.product_id,
			COUNT(CASE WHEN upi.interaction_type = 'view' THEN 1 END) as view_count,
			COUNT(CASE WHEN upi.interaction_type = 'add_to_cart' THEN 1 END) as cart_adds,
			COUNT(CASE WHEN upi.interaction_type = 'wishlist_add' THEN 1 END) as wishlist_adds,
			COALESCE(purchase_data.purchase_count, 0) as purchase_count,
			COALESCE(review_data.total_rating, 0) as total_rating,
			COALESCE(review_data.review_count, 0) as review_count
		FROM UserProductInteraction upi
		LEFT JOIN (
			SELECT oi.product_id, COUNT(*) as purchase_count
			FROM OrderItem oi
			JOIN ` + "`Order`" + ` o ON oi.order_id = o.order_id
			WHERE o.firebase_uid = ? AND o.status = 'Completed'
			GROUP BY oi.product_id
		) purchase_data ON upi.product_id = purchase_data.product_id
		LEFT JOIN (
			SELECT product_id, SUM(rating) as total_rating, COUNT(*) as review_count
			FROM Review
			WHERE firebase_uid = ?
			GROUP BY product_id
		) review_data ON upi.product_id = review_data.product_id
		WHERE upi.firebase_uid = ?
		GROUP BY upi.product_id
		ORDER BY (
			COUNT(CASE WHEN upi.interaction_type = 'view' THEN 1 END) * 0.1 +
			COUNT(CASE WHEN upi.interaction_type = 'add_to_cart' THEN 1 END) * 0.3 +
			COUNT(CASE WHEN upi.interaction_type = 'wishlist_add' THEN 1 END) * 0.2 +
			COALESCE(purchase_data.purchase_count, 0) * 1.0 +
			COALESCE(review_data.review_count, 0) * 0.5
		) DESC`

	rows, err := r.db.Query(query, firebaseUID, firebaseUID, firebaseUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var interactions []model.UserInteractionSummary
	for rows.Next() {
		var interaction model.UserInteractionSummary
		err := rows.Scan(
			&interaction.ProductID,
			&interaction.ViewCount,
			&interaction.CartAdds,
			&interaction.WishlistAdds,
			&interaction.PurchaseCount,
			&interaction.TotalRating,
			&interaction.ReviewCount,
		)
		if err != nil {
			return nil, err
		}

		interaction.FirebaseUID = firebaseUID
		// Calculate interaction score
		interaction.InteractionScore = float64(interaction.ViewCount)*0.1 +
			float64(interaction.CartAdds)*0.3 +
			float64(interaction.WishlistAdds)*0.2 +
			float64(interaction.PurchaseCount)*1.0 +
			float64(interaction.ReviewCount)*0.5

		interactions = append(interactions, interaction)
	}

	return interactions, nil
}

// GetUserPreferences retrieves user preferences
func (r *recommendationRepository) GetUserPreferences(firebaseUID string) (*model.UserPreference, error) {
	query := `SELECT firebase_uid, flower_preferences, occasion_preferences, price_min, price_max, average_spent, last_updated 
			  FROM UserPreference WHERE firebase_uid = ?`

	row := r.db.QueryRow(query, firebaseUID)

	var pref model.UserPreference
	err := row.Scan(&pref.FirebaseUID, &pref.FlowerPreferences, &pref.OccasionPreferences,
		&pref.PriceMin, &pref.PriceMax, &pref.AverageSpent, &pref.LastUpdated)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User preferences not found
		}
		return nil, err
	}

	return &pref, nil
}

// SaveUserPreferences saves or updates user preferences
func (r *recommendationRepository) SaveUserPreferences(pref *model.UserPreference) error {
	query := `INSERT INTO UserPreference (firebase_uid, flower_preferences, occasion_preferences, price_min, price_max, average_spent, last_updated)
			  VALUES (?, ?, ?, ?, ?, ?, ?)
			  ON DUPLICATE KEY UPDATE
			  flower_preferences = VALUES(flower_preferences),
			  occasion_preferences = VALUES(occasion_preferences),
			  price_min = VALUES(price_min),
			  price_max = VALUES(price_max),
			  average_spent = VALUES(average_spent),
			  last_updated = VALUES(last_updated)`

	_, err := r.db.Exec(query, pref.FirebaseUID, pref.FlowerPreferences, pref.OccasionPreferences,
		pref.PriceMin, pref.PriceMax, pref.AverageSpent, time.Now())

	return err
}

// GetProductSimilarities retrieves similar products
func (r *recommendationRepository) GetProductSimilarities(productID uint, limit int) ([]model.ProductSimilarity, error) {
	query := `SELECT product_id_1, product_id_2, similarity_score, similarity_type, updated_at
			  FROM ProductSimilarity 
			  WHERE (product_id_1 = ? OR product_id_2 = ?) AND similarity_score >= 0.1
			  ORDER BY similarity_score DESC
			  LIMIT ?`

	rows, err := r.db.Query(query, productID, productID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var similarities []model.ProductSimilarity
	for rows.Next() {
		var sim model.ProductSimilarity
		err := rows.Scan(&sim.ProductID1, &sim.ProductID2, &sim.SimilarityScore, &sim.SimilarityType, &sim.UpdatedAt)
		if err != nil {
			return nil, err
		}
		similarities = append(similarities, sim)
	}

	return similarities, nil
}

// SaveProductSimilarity saves product similarity data
func (r *recommendationRepository) SaveProductSimilarity(similarity *model.ProductSimilarity) error {
	query := `INSERT INTO ProductSimilarity (product_id_1, product_id_2, similarity_score, similarity_type, updated_at)
			  VALUES (?, ?, ?, ?, ?)
			  ON DUPLICATE KEY UPDATE
			  similarity_score = VALUES(similarity_score),
			  similarity_type = VALUES(similarity_type),
			  updated_at = VALUES(updated_at)`

	_, err := r.db.Exec(query, similarity.ProductID1, similarity.ProductID2,
		similarity.SimilarityScore, similarity.SimilarityType, time.Now())

	return err
}

// GetTrendingProducts retrieves trending products
func (r *recommendationRepository) GetTrendingProducts(period string, limit int) ([]model.TrendingProduct, error) {
	query := `SELECT product_id, trend_score, view_count, purchase_count, period, updated_at
			  FROM TrendingProduct 
			  WHERE period = ? 
			  ORDER BY trend_score DESC
			  LIMIT ?`

	rows, err := r.db.Query(query, period, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var trending []model.TrendingProduct
	for rows.Next() {
		var t model.TrendingProduct
		err := rows.Scan(&t.ProductID, &t.TrendScore, &t.ViewCount, &t.PurchaseCount, &t.Period, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		trending = append(trending, t)
	}

	return trending, nil
}

// UpdateTrendingProducts updates trending product data
func (r *recommendationRepository) UpdateTrendingProducts(products []model.TrendingProduct) error {
	if len(products) == 0 {
		return nil
	}

	// Build bulk insert query
	valueStrings := make([]string, 0, len(products))
	valueArgs := make([]interface{}, 0, len(products)*6)

	for _, product := range products {
		valueStrings = append(valueStrings, "(?, ?, ?, ?, ?, ?)")
		valueArgs = append(valueArgs, product.ProductID, product.TrendScore,
			product.ViewCount, product.PurchaseCount, product.Period, time.Now())
	}

	query := fmt.Sprintf(`INSERT INTO TrendingProduct (product_id, trend_score, view_count, purchase_count, period, updated_at)
						  VALUES %s
						  ON DUPLICATE KEY UPDATE
						  trend_score = VALUES(trend_score),
						  view_count = VALUES(view_count),
						  purchase_count = VALUES(purchase_count),
						  updated_at = VALUES(updated_at)`,
		strings.Join(valueStrings, ","))

	_, err := r.db.Exec(query, valueArgs...)
	return err
}

// GetUserPurchaseHistory retrieves user's purchase history
func (r *recommendationRepository) GetUserPurchaseHistory(firebaseUID string) ([]model.Product, error) {
	query := `
		SELECT DISTINCT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		JOIN OrderItem oi ON fp.product_id = oi.product_id
		JOIN ` + "`Order`" + ` o ON oi.order_id = o.order_id
		WHERE o.firebase_uid = ? AND o.status = 'Completed'
		ORDER BY o.order_date DESC`

	rows, err := r.db.Query(query, firebaseUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

// GetUserCartHistory retrieves products user has added to cart
func (r *recommendationRepository) GetUserCartHistory(firebaseUID string) ([]model.Product, error) {
	query := `
		SELECT DISTINCT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		JOIN CartItem ci ON fp.product_id = ci.product_id
		JOIN Cart c ON ci.cart_id = c.cart_id
		WHERE c.firebase_uid = ?
		ORDER BY ci.added_at DESC`

	rows, err := r.db.Query(query, firebaseUID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

// GetUserViewHistory retrieves products user has viewed
func (r *recommendationRepository) GetUserViewHistory(firebaseUID string, limit int) ([]model.Product, error) {
	query := `
		SELECT DISTINCT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		JOIN UserProductInteraction upi ON fp.product_id = upi.product_id
		WHERE upi.firebase_uid = ? AND upi.interaction_type = 'view'
		ORDER BY upi.timestamp DESC
		LIMIT ?`

	rows, err := r.db.Query(query, firebaseUID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

// GetSimilarUsers finds users with similar preferences
func (r *recommendationRepository) GetSimilarUsers(firebaseUID string, limit int) ([]string, error) {
	// Find users who have purchased similar products
	query := `
		SELECT DISTINCT o2.firebase_uid
		FROM ` + "`Order`" + ` o1
		JOIN OrderItem oi1 ON o1.order_id = oi1.order_id
		JOIN OrderItem oi2 ON oi1.product_id = oi2.product_id
		JOIN ` + "`Order`" + ` o2 ON oi2.order_id = o2.order_id
		WHERE o1.firebase_uid = ? AND o2.firebase_uid != ? 
		AND o1.status = 'Completed' AND o2.status = 'Completed'
		GROUP BY o2.firebase_uid
		ORDER BY COUNT(DISTINCT oi1.product_id) DESC
		LIMIT ?`

	rows, err := r.db.Query(query, firebaseUID, firebaseUID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var firebaseUIDs []string
	for rows.Next() {
		var fuid string
		if err := rows.Scan(&fuid); err != nil {
			return nil, err
		}
		firebaseUIDs = append(firebaseUIDs, fuid)
	}

	return firebaseUIDs, nil
}

// GetUsersWhoAlsoBought finds users who bought a specific product
func (r *recommendationRepository) GetUsersWhoAlsoBought(productID uint, limit int) ([]string, error) {
	query := `
		SELECT DISTINCT o.firebase_uid
		FROM ` + "`Order`" + ` o
		JOIN OrderItem oi ON o.order_id = oi.order_id
		WHERE oi.product_id = ? AND o.status = 'Completed'
		ORDER BY o.order_date DESC
		LIMIT ?`

	rows, err := r.db.Query(query, productID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var firebaseUIDs []string
	for rows.Next() {
		var fuid string
		if err := rows.Scan(&fuid); err != nil {
			return nil, err
		}
		firebaseUIDs = append(firebaseUIDs, fuid)
	}

	return firebaseUIDs, nil
}

// GetProductsByFlowerType retrieves products by flower type
func (r *recommendationRepository) GetProductsByFlowerType(flowerType string, excludeProductID uint, limit int) ([]model.Product, error) {
	query := `
		SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		WHERE ft.name = ? AND fp.product_id != ? AND fp.stock_quantity > 0
		ORDER BY fp.created_at DESC
		LIMIT ?`

	rows, err := r.db.Query(query, flowerType, excludeProductID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

// GetProductsByOccasion retrieves products by occasion
func (r *recommendationRepository) GetProductsByOccasion(occasion string, excludeProductID uint, limit int) ([]model.Product, error) {
	query := `
		SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		JOIN ProductOccasion po ON fp.product_id = po.product_id
		JOIN Occasion o ON po.occasion_id = o.occasion_id
		WHERE o.name = ? AND fp.product_id != ? AND fp.stock_quantity > 0
		ORDER BY fp.created_at DESC
		LIMIT ?`

	rows, err := r.db.Query(query, occasion, excludeProductID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

// GetProductsByPriceRange retrieves products within price range
func (r *recommendationRepository) GetProductsByPriceRange(minPrice, maxPrice float64, excludeProductID uint, limit int) ([]model.Product, error) {
	query := `
		SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		WHERE fp.base_price BETWEEN ? AND ? AND fp.product_id != ? AND fp.stock_quantity > 0
		ORDER BY fp.created_at DESC
		LIMIT ?`

	rows, err := r.db.Query(query, minPrice, maxPrice, excludeProductID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

// SaveRecommendationFeedback saves user feedback on recommendations
func (r *recommendationRepository) SaveRecommendationFeedback(firebaseUID string, productID uint, recommendationType, action string) error {
	query := `INSERT INTO RecommendationFeedback (firebase_uid, product_id, recommendation_type, action, created_at)
			  VALUES (?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, firebaseUID, productID, recommendationType, action, time.Now())
	return err
}

// GetRecommendationStats retrieves recommendation performance statistics
func (r *recommendationRepository) GetRecommendationStats(period string) (map[string]interface{}, error) {
	// This is a simplified version - in a real implementation you'd have more detailed analytics
	stats := make(map[string]interface{})

	// Get total recommendations count (placeholder)
	var totalCount int
	query := `SELECT COUNT(*) FROM RecommendationFeedback WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
	if err := r.db.QueryRow(query).Scan(&totalCount); err != nil {
		totalCount = 0
	}

	stats["total_recommendations"] = totalCount
	stats["period"] = period
	stats["generated_at"] = time.Now()

	return stats, nil
}
