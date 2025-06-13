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
