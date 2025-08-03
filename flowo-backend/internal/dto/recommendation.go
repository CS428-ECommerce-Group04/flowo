package dto

// RecommendationRequestDTO represents the API request for recommendations
type RecommendationRequestDTO struct {
	// User ID for personalized recommendations (optional)
	UserID *int `json:"user_id,omitempty" form:"user_id"`
	// Session ID for anonymous users
	SessionID string `json:"session_id,omitempty" form:"session_id"`
	// Type of recommendation
	RecommendationType string `json:"recommendation_type" form:"recommendation_type" binding:"required" example:"personalized" enums:"personalized,similar,trending,occasion_based,price_based"`
	// Reference product ID for similar product recommendations
	ProductID *uint `json:"product_id,omitempty" form:"product_id"`
	// Occasion filter for occasion-based recommendations  
	Occasion string `json:"occasion,omitempty" form:"occasion"`
	// Price range for price-based recommendations
	PriceMin *float64 `json:"price_min,omitempty" form:"price_min"`
	PriceMax *float64 `json:"price_max,omitempty" form:"price_max"`
	// Number of recommendations to return
	Limit int `json:"limit,omitempty" form:"limit" example:"10"`
}

// RecommendationResponseDTO represents the API response for recommendations
type RecommendationResponseDTO struct {
	// Type of recommendation used
	RecommendationType string `json:"recommendation_type"`
	// List of recommended products with scores
	Recommendations []RecommendedProductDTO `json:"recommendations"`
	// Explanation of why these were recommended
	Explanation string `json:"explanation"`
	// Timestamp when recommendations were generated
	GeneratedAt string `json:"generated_at"`
	// Total number of available recommendations
	Total int `json:"total"`
}

// RecommendedProductDTO represents a product with its recommendation score
type RecommendedProductDTO struct {
	// Product information
	Product ProductResponse `json:"product"`
	// Recommendation score (0.0 to 1.0)
	Score float64 `json:"score" example:"0.85"`
	// Reason for recommendation
	Reason string `json:"reason" example:"Based on your previous purchases"`
	// Category of recommendation
	Category string `json:"category" example:"similar_products"`
}

// UserPreferenceDTO represents user preferences for API responses
type UserPreferenceDTO struct {
	UserID              int                `json:"user_id"`
	PreferredFlowers    map[string]float64 `json:"preferred_flowers"`
	PreferredOccasions  map[string]float64 `json:"preferred_occasions"`
	PriceRange          PriceRangeDTO      `json:"price_range"`
	LastUpdated         string             `json:"last_updated"`
}

// PriceRangeDTO represents user's price preferences
type PriceRangeDTO struct {
	PreferredMin float64 `json:"preferred_min"`
	PreferredMax float64 `json:"preferred_max"`
	AverageSpent float64 `json:"average_spent"`
}

// TrendingProductDTO represents trending product information for API
type TrendingProductDTO struct {
	Product       ProductResponse `json:"product"`
	TrendScore    float64         `json:"trend_score"`
	ViewCount     int             `json:"view_count"`
	PurchaseCount int             `json:"purchase_count"`
	Period        string          `json:"period"`
}

// RecommendationFeedbackDTO represents user feedback on recommendations
type RecommendationFeedbackDTO struct {
	UserID             int    `json:"user_id" binding:"required"`
	ProductID          uint   `json:"product_id" binding:"required"`
	RecommendationType string `json:"recommendation_type" binding:"required"`
	Action             string `json:"action" binding:"required" enums:"clicked,purchased,dismissed,liked"`
	SessionID          string `json:"session_id,omitempty"`
}

// RecommendationStatsDTO represents statistics about recommendation performance
type RecommendationStatsDTO struct {
	TotalRecommendations int     `json:"total_recommendations"`
	ClickThroughRate     float64 `json:"click_through_rate"`
	ConversionRate       float64 `json:"conversion_rate"`
	AverageScore         float64 `json:"average_score"`
	TopPerformingType    string  `json:"top_performing_type"`
}