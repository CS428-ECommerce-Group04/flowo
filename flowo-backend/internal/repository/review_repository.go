package repository

import (
	"database/sql"
	//"errors"
	"flowo-backend/internal/model"
	"fmt"
)

type ReviewRepository interface {
	CreateReview(review *model.Review) error
	GetAllReviews() ([]model.Review, error)
	GetReviewsByProductID(productID int) ([]model.Review, error)
	DeleteReview(reviewID int) error
}

type reviewRepository struct {
	db *sql.DB
}

func NewReviewRepository(db *sql.DB) ReviewRepository {
	return &reviewRepository{db: db}
}

func (r *reviewRepository) CreateReview(review *model.Review) error {
	query := `INSERT INTO Review (product_id, user_id, rating, comment, review_date)
	          VALUES (?, ?, ?, ?, NOW())`
	_, err := r.db.Exec(query, review.ProductID, review.UserID, review.Rating, review.Comment)
	if err != nil {
		fmt.Println("❌ DB INSERT ERROR:", err) // 👈 in lỗi thực tế
	}
	return err
}

func (r *reviewRepository) GetAllReviews() ([]model.Review, error) {
	query := `SELECT review_id, product_id, user_id, rating, comment, review_date FROM Review`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []model.Review
	for rows.Next() {
		var review model.Review
		if err := rows.Scan(&review.ReviewID, &review.ProductID, &review.UserID, &review.Rating, &review.Comment, &review.ReviewDate); err != nil {
			return nil, err
		}
		reviews = append(reviews, review)
	}
	return reviews, nil
}

func (r *reviewRepository) GetReviewsByProductID(productID int) ([]model.Review, error) {
	query := `SELECT review_id, product_id, user_id, rating, comment, review_date FROM Review WHERE product_id = ?`
	rows, err := r.db.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reviews []model.Review
	for rows.Next() {
		var review model.Review
		if err := rows.Scan(&review.ReviewID, &review.ProductID, &review.UserID, &review.Rating, &review.Comment, &review.ReviewDate); err != nil {
			return nil, err
		}
		reviews = append(reviews, review)
	}
	return reviews, nil
}

func (r *reviewRepository) DeleteReview(reviewID int) error {
	query := `DELETE FROM Review WHERE review_id = ?`
	_, err := r.db.Exec(query, reviewID)
	return err
}
