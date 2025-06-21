package service

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"fmt"
	"time"
)

type CartService struct {
	Repo        repository.CartRepository
	ProductRepo repository.Repository
	PricingSvc  *PricingService
}

func NewCartService(repo repository.CartRepository, productRepo repository.Repository, pricingSvc *PricingService) *CartService {
	return &CartService{
		Repo:        repo,
		ProductRepo: productRepo,
		PricingSvc:  pricingSvc,
	}
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

func (s *CartService) GetCartWithPrices(userID int) ([]dto.CartItemResponse, error) {
	cartID, err := s.Repo.GetOrCreateCart(userID)
	if err != nil {
		return nil, err
	}

	cartItems, err := s.Repo.GetCartItems(cartID)
	if err != nil {
		return nil, err
	}

	var productIDs []int
	for _, item := range cartItems {
		productIDs = append(productIDs, item.ProductID)
	}

	productsMap, err := s.ProductRepo.GetProductsByIDs(productIDs)
	if err != nil {
		return nil, err
	}

	//calculate effective prices
	var responses []dto.CartItemResponse
	now := time.Now()
	for _, item := range cartItems {
		product, ok := productsMap[item.ProductID]
		if !ok {
			continue
		}

		price, err := s.PricingSvc.GetEffectivePrice(product, now)
		if err != nil {
			return nil, err
		}

		responses = append(responses, dto.CartItemResponse{
			ProductID:      int(product.ProductID),
			Name:           product.Name,
			Description:    product.Description,
			Quantity:       item.Quantity,
			Price:          product.BasePrice,
			EffectivePrice: price,
			TotalPrice:     price * float64(item.Quantity),
		})
	}

	return responses, nil
}
