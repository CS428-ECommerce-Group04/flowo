package service

import (
	"errors"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"time"
)

type OrderService struct {
	OrderRepo   repository.OrderRepository
	CartRepo    repository.CartRepository
	CartService *CartService
}

func NewOrderService(orderRepo repository.OrderRepository, cartRepo repository.CartRepository, cartService *CartService) *OrderService {
	return &OrderService{
		OrderRepo:   orderRepo,
		CartRepo:    cartRepo,
		CartService: cartService,
	}
}

func (s *OrderService) GetUserOrders(FirebaseUID string) ([]dto.OrderResponse, error) {
	orders, err := s.OrderRepo.GetOrdersByUser(FirebaseUID)
	if err != nil {
		return nil, err
	}

	var res []dto.OrderResponse
	for _, o := range orders {
		res = append(res, dto.OrderResponse{
			OrderID:        o.OrderID,
			Status:         o.Status,
			OrderDate:      o.OrderDate.Format("2006-01-02 15:04:05"),
			TotalAmount:    o.FinalTotalAmount,
			ShippingMethod: o.ShippingMethod,
		})
	}
	return res, nil
}

func (s *OrderService) UpdateStatus(orderID int, req dto.UpdateOrderStatusRequest, FirebaseUID string) error {
	order, err := s.OrderRepo.GetOrderByID(orderID)
	if err != nil {
		return err
	}

	if order.FirebaseUID != FirebaseUID {
		return errors.New("unauthorized: not your order")
	}

	var methodPtr *string
	if req.ShippingMethod != "" {
		methodPtr = &req.ShippingMethod
	}

	return s.OrderRepo.UpdateOrderStatus(orderID, req.Status, methodPtr)
}

func (s *OrderService) CreateOrder(FirebaseUID string, req dto.CreateOrderRequest) (int, error) {
	items, err := s.CartService.GetCartWithPrices(FirebaseUID)
	if err != nil || len(items) == 0 {
		return 0, errors.New("cart is empty or error getting cart prices")
	}

	var subtotal float64
	for _, item := range items {
		subtotal += item.TotalPrice
	}
	shipping := 5.0
	finalTotal := subtotal + shipping

	order := model.Order{
		FirebaseUID:       FirebaseUID,
		OrderDate:         time.Now(),
		Status:            "Processing",
		ShippingAddressID: req.ShippingAddressID,
		BillingAddressID:  getBillingAddressID(req.BillingAddressID, req.ShippingAddressID),
		SubtotalAmount:    subtotal,
		ShippingCost:      shipping,
		FinalTotalAmount:  finalTotal,
		Notes:             req.Notes,
		ShippingMethod:    req.ShippingMethod,
	}

	orderID, err := s.OrderRepo.CreateOrderWithItemsAndStock(FirebaseUID, order, items)
	if err != nil {
		return 0, err
	}

	cartID, _ := s.CartRepo.GetCartIDByUser(FirebaseUID)
	_ = s.CartRepo.ClearCart(cartID)

	return orderID, nil
}

func getBillingAddressID(billing *int, shipping int) int {
	if billing != nil {
		return *billing
	}
	return shipping
}

func (s *OrderService) GetOrderDetailByID(orderID int) (*dto.OrderDetailResponse, error) {
	return s.OrderRepo.GetOrderDetailByID(orderID)
}
func (s *OrderService) GetOrderOwnerID(orderID int) (string, error) {
	return s.OrderRepo.GetOrderOwnerID(orderID)
}
