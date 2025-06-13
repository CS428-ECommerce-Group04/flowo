package model

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
	// Status of the product (NewFLower, OldFlower, LowStock)
	Status string `json:"status" example:"NewFlower" enums:"NewFlower,OldFlower,LowStock"`
	// Stock quantity of the product
	StockQuantity int `json:"stock_quantity" example:"100"`
	// Timestamp when the product was created
	CreatedAt string `json:"created_at" example:"2024-03-15T08:00:00Z"`
	// Timestamp when the product was last updated
	UpdatedAt string `json:"updated_at" example:"2024-03-15T08:00:00Z"`
}
type FlowerType struct {
	// Unique identifier of the flower type
	FlowerTypeID uint   `json:"flower_type_id" example:"1"`
	// Name of the flower type
	Name string `json:"name" example:"Rose"`
}