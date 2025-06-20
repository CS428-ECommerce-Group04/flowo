package service

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/repository"
)

type CartService struct {
	Repo repository.CartRepository
}

func NewCartService(repo repository.CartRepository) *CartService {
	return &CartService{Repo: repo}
}

func (s *CartService) AddToCart(req dto.AddToCartRequest) error {
	cartID, err := s.Repo.GetOrCreateCart(req.UserID)
	if err != nil {
		return err
	}
	return s.Repo.AddOrUpdateCartItem(cartID, req.ProductID, req.Quantity)
}
