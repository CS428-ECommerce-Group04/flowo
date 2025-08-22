package model

import "time"

// Product represents a flower product in the catalog
type Product struct {
	// Unique identifier of the product
	ProductID uint `json:"product_id" example:"1"`
	// Name of the product
	Name string `json:"name" example:"Red Rose Bouquet"`
	// Description of the product
	Description string `json:"description" example:"A beautiful bouquet of red roses, perfect for any occasion."`
	// Flower type of the product (e.g., Rose, Tulip, Lily)
	FlowerType string `json:"flower_type" example:"Rose"`
	// Base price of the product
	BasePrice float64 `json:"base_price" example:"29.99"`
	// Current price (after applying dynamic pricing rules)
	CurrentPrice float64 `json:"current_price" example:"25.49"`
	// Status of the product (NewFlower, OldFlower, LowStock)
	Status string `json:"status" example:"NewFlower" enums:"NewFlower,OldFlower,LowStock"`
	// Stock quantity of the product
	StockQuantity int `json:"stock_quantity" example:"100"`
	// Timestamp when the product was created
	CreatedAt time.Time `json:"created_at" example:"2024-03-15T08:00:00Z"`
	// Timestamp when the product was last updated
	UpdatedAt time.Time `json:"updated_at" example:"2024-03-15T08:00:00Z"`
	// Images associated with the product
	Images []ProductImage `json:"images,omitempty"`
	// Occasions this product is suitable for
	Occasions []string `json:"occasions,omitempty"`
	// Average rating from reviews
	AverageRating float64 `json:"average_rating" example:"4.5"`
	// Total number of reviews
	ReviewCount int `json:"review_count" example:"23"`
	// Best-selling rank (for sorting)
	SalesRank int  `json:"sales_rank" example:"1"`
	IsActive  bool `gorm:"default:true" json:"is_active"`
}

// ProductImage represents an image associated with a product
type ProductImage struct {
	// Unique identifier of the image
	ImageID uint `json:"image_id" example:"1"`
	// Product ID this image belongs to
	ProductID uint `json:"product_id" example:"1"`
	// URL of the image
	ImageURL string `json:"image_url" example:"https://example.com/images/rose.jpg"`
	// Alt text for accessibility
	AltText string `json:"alt_text" example:"Red Rose Bouquet"`
	// Whether this is the primary image
	IsPrimary bool `json:"is_primary" example:"true"`
}

// FlowerType represents a type of flower
type FlowerType struct {
	// Unique identifier of the flower type
	FlowerTypeID uint `json:"flower_type_id" example:"1"`
	// Name of the flower type
	Name string `json:"name" example:"Rose"`
	// Description of the flower type
	Description string `json:"description,omitempty" example:"Classic romantic flower"`
}

// Occasion represents special occasions for flowers
type Occasion struct {
	// Unique identifier of the occasion
	OccasionID uint `json:"occasion_id" example:"1"`
	// Name of the occasion
	Name string `json:"name" example:"Valentine's Day"`
}

// ProductSearchRequest represents the search and filter parameters
type ProductSearchRequest struct {
	// Search query for product name or description
	Query string `json:"query,omitempty" example:"rose"`
	// Filter by flower type
	FlowerType string `json:"flower_type,omitempty" example:"Rose"`
	// Filter by occasion
	Occasion string `json:"occasion,omitempty" example:"Valentine's Day"`
	// Minimum price filter
	PriceMin float64 `json:"price_min,omitempty" example:"10.00"`
	// Maximum price filter
	PriceMax float64 `json:"price_max,omitempty" example:"100.00"`
	// Filter by product condition
	Condition string `json:"condition,omitempty" example:"NewFlower" enums:"NewFlower,OldFlower,LowStock"`
	// Sorting option
	SortBy string `json:"sort_by,omitempty" example:"price_asc" enums:"price_asc,price_desc,name_asc,name_desc,newest,best_selling"`
	// Page number for pagination
	Page int `json:"page,omitempty" example:"1"`
	// Number of items per page
	Limit int `json:"limit,omitempty" example:"20"`
}

// ProductSearchResponse represents the response for product search
type ProductSearchResponse struct {
	// List of products
	Products []Product `json:"products"`
	// Pagination information
	Pagination PaginationInfo `json:"pagination"`
	// Filter options available
	Filters FilterOptions `json:"filters"`
}

// PaginationInfo contains pagination metadata
type PaginationInfo struct {
	// Current page number
	Page int `json:"page" example:"1"`
	// Number of items per page
	Limit int `json:"limit" example:"20"`
	// Total number of items
	Total int `json:"total" example:"150"`
	// Total number of pages
	TotalPages int `json:"total_pages" example:"8"`
	// Whether there's a next page
	HasNext bool `json:"has_next" example:"true"`
	// Whether there's a previous page
	HasPrev bool `json:"has_prev" example:"false"`
}

// FilterOptions contains available filter options
type FilterOptions struct {
	// Available flower types
	FlowerTypes []FlowerType `json:"flower_types"`
	// Available occasions
	Occasions []Occasion `json:"occasions"`
	// Price range
	PriceRange PriceRange `json:"price_range"`
}

// PriceRange represents the price range of products
type PriceRange struct {
	// Minimum price in the catalog
	Min float64 `json:"min" example:"5.99"`
	// Maximum price in the catalog
	Max float64 `json:"max" example:"199.99"`
}
