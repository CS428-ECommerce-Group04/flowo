package service

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
)

type ReviewService struct {
	Repo repository.ReviewRepository
}

func NewReviewService(repo repository.ReviewRepository) *ReviewService {
	return &ReviewService{Repo: repo}
}

func (s *ReviewService) CreateReview(productID int, firebaseUID string, req dto.CreateReviewRequest) error {
	review := model.Review{
		ProductID:   productID,
		FirebaseUID: firebaseUID,
		Rating:      req.Rating,
		Comment:     req.Comment,
	}
	return s.Repo.CreateReview(&review)
}

func (s *ReviewService) GetReviewsByProduct(productID int) ([]dto.ReviewResponse, error) {
	reviews, err := s.Repo.GetReviewsByProductID(productID)
	if err != nil {
		return nil, err
	}

	var res []dto.ReviewResponse
	for _, r := range reviews {
		res = append(res, dto.ReviewResponse{
			ReviewID:    r.ReviewID,
			ProductID:   r.ProductID,
			FirebaseUID: r.FirebaseUID,
			Rating:      r.Rating,
			Comment:     r.Comment,
			ReviewDate:  r.ReviewDate.Format("2006-01-02 15:04:05"),
		})
	}
	return res, nil
}
