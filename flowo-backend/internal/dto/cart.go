package dto

type AddToCartRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
	UserID    int `json:"user_id" binding:"required"`
}
type UpdateCartItemRequest struct {
	UserID    int `json:"user_id" binding:"required"`
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
}
type RemoveCartItemRequest struct {
	UserID    int `json:"user_id" binding:"required"`
	ProductID int `json:"product_id" binding:"required"`
}
type CartItemResponse struct {
	ProductID   int     `json:"product_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	//ImageURL      string  `json:"image_url,omitempty"`
	//TotalPrice    float64 `json:"total_price"`         // Quantity * Price
	//StockQuantity int     `json:"stock_quantity"`
}
