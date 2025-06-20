package service

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"fmt"
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

func (s *CartService) UpdateCartItem(req dto.UpdateCartItemRequest) error {
	cartID, err := s.Repo.GetOrCreateCart(req.UserID)
	if err != nil {
		return err
	}
	return s.Repo.UpdateCartItemQuantity(cartID, req.ProductID, req.Quantity)
}

func (s *CartService) RemoveCartItem(userID, productID int) error {
	cartID, err := s.Repo.GetCartIDByUser(userID)
	if err != nil {
		return err
	}
	if cartID == 0 {
		return fmt.Errorf("cart does not exist")
	}
	return s.Repo.RemoveCartItem(cartID, productID)
}

func (s *CartService) GetCartItems(userID int) ([]model.CartItem, error) {
	cartID, err := s.Repo.GetOrCreateCart(userID)
	if err != nil {
		return nil, err
	}
	return s.Repo.GetCartItems(cartID)
}
