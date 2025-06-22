package dto

// ProductCreate represents the data structure for creating a new product
// @Description Product creation request body
type ProductCreate struct {
	// Name of the product
	Name string `json:"name" example:"Red Rose Bouquet" binding:"required"`
	// Description of the product
	Description string `json:"description" example:"A beautiful bouquet of red roses, perfect for any occasion." binding:"required"`
	// Flower type of the product (e.g., Rose, Tulip, Lily)
	FlowerType string `json:"flower_type" example:"Rose" binding:"required"`
	// Base price of the product
	BasePrice float64 `json:"base_price" example:"29.99" binding:"required"`
	// Status of the product (NewFlower, OldFlower, LowStock)
	Status string `json:"status" example:"NewFlower" enums:"NewFlower,OldFlower,LowStock" binding:"required"`
	// Stock quantity of the product
	StockQuantity int `json:"stock_quantity" example:"100" binding:"required"`
}


type ProductResponse struct {
	ProductID      uint    `json:"product_id"`
	Name           string  `json:"name"`
	Description    string  `json:"description"`
	FlowerType     string  `json:"flower_type"`
	BasePrice      float64 `json:"base_price"`
	Status         string  `json:"status"`
	StockQuantity  int     `json:"stock_quantity"`
	CreatedAt      string  `json:"created_at"`
	UpdatedAt      string  `json:"updated_at"`
	EffectivePrice float64 `json:"effective_price"`
}
// ProductSearchQuery represents query parameters for product search
// @Description Product search and filter parameters
type ProductSearchQuery struct {
	// Search query for product name or description
	Query string `form:"query" json:"query,omitempty" example:"rose"`
	// Filter by flower type
	FlowerType string `form:"flower_type" json:"flower_type,omitempty" example:"Rose"`
	// Filter by occasion
	Occasion string `form:"occasion" json:"occasion,omitempty" example:"Valentine's Day"`
	// Minimum price filter
	PriceMin *float64 `form:"price_min" json:"price_min,omitempty" example:"10.00"`
	// Maximum price filter
	PriceMax *float64 `form:"price_max" json:"price_max,omitempty" example:"100.00"`
	// Filter by product condition/status
	Condition string `form:"condition" json:"condition,omitempty" example:"NewFlower" enums:"NewFlower,OldFlower,LowStock"`
	// Sorting option
	SortBy string `form:"sort_by" json:"sort_by,omitempty" example:"price_asc" enums:"price_asc,price_desc,name_asc,name_desc,newest,best_selling"`
	// Page number for pagination (starts from 1)
	Page int `form:"page" json:"page,omitempty" example:"1" minimum:"1"`
	// Number of items per page
	Limit int `form:"limit" json:"limit,omitempty" example:"20" minimum:"1" maximum:"100"`
}

// ProductDetailResponse represents detailed product information
// @Description Detailed product information with images and occasions
type ProductDetailResponse struct {
	// Basic product information
	ProductID     uint    `json:"product_id" example:"1"`
	Name          string  `json:"name" example:"Red Rose Bouquet"`
	Description   string  `json:"description" example:"A beautiful bouquet of red roses, perfect for any occasion."`
	FlowerType    string  `json:"flower_type" example:"Rose"`
	BasePrice     float64 `json:"base_price" example:"29.99"`
	CurrentPrice  float64 `json:"current_price" example:"25.49"`
	Status        string  `json:"status" example:"NewFlower"`
	StockQuantity int     `json:"stock_quantity" example:"100"`
	CreatedAt     string  `json:"created_at" example:"2024-03-15T08:00:00Z"`
	UpdatedAt     string  `json:"updated_at" example:"2024-03-15T08:00:00Z"`
	
	// Enhanced information
	Images        []ProductImageDTO `json:"images"`
	Occasions     []string          `json:"occasions"`
	AverageRating float64           `json:"average_rating" example:"4.5"`
	ReviewCount   int               `json:"review_count" example:"23"`
	SalesRank     int               `json:"sales_rank" example:"1"`
}

// ProductImageDTO represents product image information
// @Description Product image information
type ProductImageDTO struct {
	// Image ID
	ImageID uint `json:"image_id" example:"1"`
	// Image URL
	ImageURL string `json:"image_url" example:"https://example.com/images/rose.jpg"`
	// Alt text for accessibility
	AltText string `json:"alt_text" example:"Red Rose Bouquet"`
	// Whether this is the primary image
	IsPrimary bool `json:"is_primary" example:"true"`

}
