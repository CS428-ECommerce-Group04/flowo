package model

import "time"

type Review struct {
    ReviewID   int       `json:"review_id"`
    ProductID  int       `json:"product_id"`
    UserID     int       `json:"user_id"`
    Rating     int       `json:"rating"`
    Comment    string    `json:"comment"`
    ReviewDate time.Time `json:"review_date"`
}
