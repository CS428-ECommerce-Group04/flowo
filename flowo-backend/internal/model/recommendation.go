package model

import "time"

// RecommendationRequest represents a request for product recommendations
type RecommendationRequest struct {
	// User ID for personalized recommendations (optional)
	UserID *int `json:"user_id,omitempty"`
	// Session ID for anonymous users
	SessionID string `json:"session_id,omitempty"`
	// Type of recommendation
	RecommendationType string `json:"recommendation_type" example:"personalized" enums:"personalized,similar,trending,occasion_based,price_based"`
	// Reference product ID for similar product recommendations
	ProductID *uint `json:"product_id,omitempty"`
	// Occasion filter for occasion-based recommendations  
	Occasion string `json:"occasion,omitempty"`
	// Price range for price-based recommendations
	PriceMin *float64 `json:"price_min,omitempty"`
	PriceMax *float64 `json:"price_max,omitempty"`
	// Number of recommendations to return
	Limit int `json:"limit,omitempty" example:"10"`
}

// RecommendationResponse represents the response containing recommended products
type RecommendationResponse struct {
	// Type of recommendation used
	RecommendationType string `json:"recommendation_type"`
	// List of recommended products with scores
	Recommendations []RecommendedProduct `json:"recommendations"`
	// Explanation of why these were recommended
	Explanation string `json:"explanation"`
	// Timestamp when recommendations were generated
	GeneratedAt time.Time `json:"generated_at"`
}

// RecommendedProduct represents a product with its recommendation score
type RecommendedProduct struct {
	// Product information
	Product Product `json:"product"`
	// Recommendation score (0.0 to 1.0)
	Score float64 `json:"score" example:"0.85"`
	// Reason for recommendation
	Reason string `json:"reason" example:"Based on your previous purchases"`
	// Category of recommendation
	Category string `json:"category" example:"similar_products"`
}

// UserPreference represents learned user preferences
type UserPreference struct {
	UserID            int                `json:"user_id" db:"user_id"`
	FlowerPreferences string             `json:"flower_preferences" db:"flower_preferences"` // JSON string
	OccasionPreferences string           `json:"occasion_preferences" db:"occasion_preferences"` // JSON string
	PriceMin          float64            `json:"price_min" db:"price_min"`
	PriceMax          float64            `json:"price_max" db:"price_max"`
	AverageSpent      float64            `json:"average_spent" db:"average_spent"`
	LastUpdated       time.Time          `json:"last_updated" db:"last_updated"`
}

// ProductSimilarity represents similarity between products
type ProductSimilarity struct {
	ProductID1      uint    `json:"product_id_1" db:"product_id_1"`
	ProductID2      uint    `json:"product_id_2" db:"product_id_2"`
	SimilarityScore float64 `json:"similarity_score" db:"similarity_score"`
	SimilarityType  string  `json:"similarity_type" db:"similarity_type"` // content, collaborative, hybrid
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// TrendingProduct represents trending product information
type TrendingProduct struct {
	ProductID     uint      `json:"product_id" db:"product_id"`
	TrendScore    float64   `json:"trend_score" db:"trend_score"`
	ViewCount     int       `json:"view_count" db:"view_count"`
	PurchaseCount int       `json:"purchase_count" db:"purchase_count"`
	Period        string    `json:"period" db:"period"` // daily, weekly, monthly
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// UserInteractionSummary represents aggregated user interactions
type UserInteractionSummary struct {
	UserID        int     `json:"user_id"`
	ProductID     uint    `json:"product_id"`
	ViewCount     int     `json:"view_count"`
	CartAdds      int     `json:"cart_adds"`
	WishlistAdds  int     `json:"wishlist_adds"`
	PurchaseCount int     `json:"purchase_count"`
	TotalRating   int     `json:"total_rating"`
	ReviewCount   int     `json:"review_count"`
	InteractionScore float64 `json:"interaction_score"`
}

// RecommendationConfig holds configuration for the recommendation engine
type RecommendationConfig struct {
	// Weights for different recommendation strategies
	CollaborativeWeight float64 `json:"collaborative_weight"`
	ContentWeight       float64 `json:"content_weight"`
	PopularityWeight    float64 `json:"popularity_weight"`
	TrendingWeight      float64 `json:"trending_weight"`
	
	// Minimum similarity threshold
	MinSimilarity     float64 `json:"min_similarity"`
	// Default number of recommendations
	DefaultLimit      int     `json:"default_limit"`
	// Cache duration in minutes
	CacheDuration     int     `json:"cache_duration"`
	// Minimum interactions for collaborative filtering
	MinInteractions   int     `json:"min_interactions"`
}

// DefaultRecommendationConfig returns default configuration
func DefaultRecommendationConfig() RecommendationConfig {
	return RecommendationConfig{
		CollaborativeWeight: 0.4,
		ContentWeight:       0.3,
		PopularityWeight:    0.2,
		TrendingWeight:      0.1,
		MinSimilarity:       0.1,
		DefaultLimit:        10,
		CacheDuration:       60,
		MinInteractions:     3,
	}
}