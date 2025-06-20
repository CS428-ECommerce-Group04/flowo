package dto

type CreateReviewRequest struct {
	//ProductID int    `json:"product_id" binding:"required"`
	UserID  int    `json:"user_id" binding:"required"`
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type ReviewResponse struct {
	ReviewID   int    `json:"review_id"`
	ProductID  int    `json:"product_id"`
	UserID     int    `json:"user_id"`
	Rating     int    `json:"rating"`
	Comment    string `json:"comment"`
	ReviewDate string `json:"review_date"`
}
