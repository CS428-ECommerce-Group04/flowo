package dto

type CreateReviewRequest struct {
	//ProductID int    `json:"product_id" binding:"required"`
	FirebaseUID string `json:"firebase_uid" binding:"required"`
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type ReviewResponse struct {
	ReviewID   int    `json:"review_id"`
	ProductID  int    `json:"product_id"`
	FirebaseUID string `json:"firebase_uid"`
	Rating     int    `json:"rating"`
	Comment    string `json:"comment"`
	ReviewDate string `json:"review_date"`
}
