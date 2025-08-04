package dto

type AddToCartRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
	UserID    int `json:"-"` // sent through controller middleware, not by user
}

type UpdateCartItemRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
	UserID    int `json:"-"`
}

type RemoveCartItemRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	UserID    int `json:"-"`
}
type CartItemResponse struct {
	ProductID   int     `json:"product_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	//ImageURL      string  `json:"image_url,omitempty"`
	EffectivePrice float64 `json:"effective_price"`
	TotalPrice     float64 `json:"total_price"`
}
