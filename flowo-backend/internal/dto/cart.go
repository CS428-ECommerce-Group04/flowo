package dto

type AddToCartRequest struct {
	ProductID int `json:"product_id" binding:"required"`
	Quantity  int `json:"quantity" binding:"required,min=1"`
	UserID    int `json:"user_id" binding:"required"`
}
