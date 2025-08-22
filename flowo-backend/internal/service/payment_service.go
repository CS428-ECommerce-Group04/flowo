package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"flowo-backend/config"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"

	"github.com/rs/zerolog/log"

	payos "github.com/payOSHQ/payos-lib-golang"
)

type PaymentService interface {
	CreatePaymentLink(req dto.CreatePaymentLinkRequest, userID string) (*dto.PaymentLinkResponse, error)
	HandleWebhook(webhook payos.WebhookType) error
	CancelOrder(orderID int, userID string) error
}

type paymentService struct {
	cfg       *config.Config
	repo      repository.PaymentRepository
	orderRepo repository.OrderRepository
	client    *http.Client
}

func NewPaymentService(cfg *config.Config, repo repository.PaymentRepository, orderRepo repository.OrderRepository) PaymentService {
	return &paymentService{cfg: cfg, repo: repo, orderRepo: orderRepo, client: &http.Client{Timeout: 10 * time.Second}}
}

// signCreatePayload moved to internal/payos

func (s *paymentService) CreatePaymentLink(req dto.CreatePaymentLinkRequest, userID string) (*dto.PaymentLinkResponse, error) {
	// ensure order exists and belongs to user
	order, err := s.orderRepo.GetOrderByID(req.OrderID)
	if err != nil || order == nil {
		return nil, errors.New("order not found")
	}
	if order.FirebaseUID != userID {
		return nil, errors.New("unauthorized")
	}

	// build PayOS CheckoutRequestType and call library helper
	// payoslib.CreatePaymentLink expects numeric amount and order code
	checkoutReq := payos.CheckoutRequestType{
		OrderCode:   int64(req.OrderID),
		Amount:      int(order.FinalTotalAmount),
		ReturnUrl:   req.ReturnURL,
		CancelUrl:   req.CancelURL,
		Description: fmt.Sprintf("Payment for order %d", req.OrderID),
	}

	respData, err := payos.CreatePaymentLink(checkoutReq)
	if err != nil {
		return nil, err
	}
	checkoutUrl := ""
	paymentLinkId := ""
	if respData != nil {
		checkoutUrl = respData.CheckoutUrl
		paymentLinkId = respData.PaymentLinkId
	}

	// persist payment record
	p := &model.Payment{
		OrderID:       req.OrderID,
		PaymentMethod: "PayOS",
		PaymentStatus: "Pending",
		TransactionID: paymentLinkId,
		PaymentLinkID: paymentLinkId,
		CheckoutUrl:   checkoutUrl,
		AmountPaid:    0,
		PaymentDate:   time.Now(),
	}
	_, err = s.repo.CreatePayment(p)
	if err != nil {
		return nil, err
	}

	return &dto.PaymentLinkResponse{CheckoutUrl: checkoutUrl, PaymentLinkId: paymentLinkId}, nil
}

func (s *paymentService) HandleWebhook(webhook payos.WebhookType) error {
	// Unmarshal into PayOS webhook type and verify signature using library
	verified, err := payos.VerifyPaymentWebhookData(webhook)
	if err != nil {
		return err
	}
	if verified == nil {
		return errors.New("invalid webhook data")
	}

	// persist raw webhook JSON into payment record (for audit) and parse fields
	rawData, err := json.Marshal(webhook)
	if err != nil {
		return err
	}
	var data map[string]interface{}
	if err := json.Unmarshal(rawData, &data); err != nil {
		return err
	}

	// PayOS webhook uses a nested `data` object. Attempt to read fields from there first,
	// then fall back to top-level fields. orderCode is usually numeric (e.g. 2).
	var nested map[string]interface{}
	if d, ok := data["data"].(map[string]interface{}); ok {
		nested = d
	} else {
		nested = data
	}

	// extract paymentLinkId (string) and amount (number)
	paymentLinkId, _ := nested["paymentLinkId"].(string)
	if paymentLinkId == "" {
		// fallback to top-level
		if v, _ := data["paymentLinkId"].(string); v != "" {
			paymentLinkId = v
		}
	}

	amountFloat := 0.0
	if a, ok := nested["amount"].(float64); ok {
		amountFloat = a
	} else if a, ok := data["amount"].(float64); ok {
		amountFloat = a
	}

	log.Debug().Msgf("Webhook received (nested) for paymentLinkId: %s, amount: %f", paymentLinkId, amountFloat)

	// Extract orderCode which may be a number (float64 after JSON unmarshal) or string
	orderID := 0
	if v, ok := nested["orderCode"]; ok && v != nil {
		switch vv := v.(type) {
		case float64:
			orderID = int(vv)
		case string:
			fmt.Sscanf(vv, "%d", &orderID)
		}
	} else if v, ok := data["orderCode"]; ok && v != nil {
		switch vv := v.(type) {
		case float64:
			orderID = int(vv)
		case string:
			if parsedID, err := strconv.Atoi(vv); err == nil {
				orderID = parsedID
			} else {
				log.Error().Err(err).Msgf("Failed to parse orderCode string '%s' to int", vv)
			}
		}
	} else if v, ok := data["orderCode"]; ok && v != nil {
		switch vv := v.(type) {
		case float64:
			orderID = int(vv)
		case string:
			if parsedID, err := strconv.Atoi(vv); err == nil {
				orderID = parsedID
			} else {
				log.Error().Err(err).Msgf("Failed to parse orderCode string '%s' to int", vv)
			}
		}
	}
	log.Debug().Msgf("Processing PayOS webhook for order ID: %d", orderID)
	var p *model.Payment
	var err2 error
	if orderID != 0 {
		p, err2 = s.repo.GetPaymentByOrderID(orderID)
		if err2 != nil {
			return err2
		}
	}
	if p == nil {
		return errors.New("payment not found")
	}

	// save raw webhook payload for auditing
	if err := s.repo.UpdatePaymentRawWebhook(p.PaymentID, string(rawData)); err != nil {
		// log but do not fail processing
		// fmt.Println("failed to save raw webhook:", err)
	}

	// Note: PayOS top-level success field may be present in webhook; read from webhook if available
	success := false
	if webhook.Success {
		success = true
	} else if s, ok := data["success"].(bool); ok && s {
		success = true
	}

	if success {
		if err := s.repo.UpdatePaymentStatus(p.PaymentID, "Completed", paymentLinkId, amountFloat); err != nil {
			return err
		}
		if err := s.orderRepo.UpdateOrderStatus(orderID, "COMPLETED", nil); err != nil {
			return err
		}
	} else {
		if err := s.repo.UpdatePaymentStatus(p.PaymentID, "Cancelled", paymentLinkId, 0); err != nil {
			return err
		}
		if err := s.orderRepo.CancelOrderAndRestoreStock(orderID); err != nil {
			return err
		}
	}

	return nil
}

// CancelOrder cancels an order (owner or admin) and updates payment status to Cancelled.
func (s *paymentService) CancelOrder(orderID int, userID string) error {
	// verify owner
	owner, err := s.orderRepo.GetOrderByID(orderID)
	if err != nil {
		return err
	}
	if owner == nil {
		return errors.New("order not found")
	}
	// allow admin bypass if needed — simple owner check here
	if owner.FirebaseUID != userID {
		return errors.New("forbidden")
	}

	// update payment record if exists
	p, err := s.repo.GetPaymentByOrderID(orderID)
	if err != nil {
		return err
	}
	if p != nil {
		if err := s.repo.UpdatePaymentStatus(p.PaymentID, "Cancelled", p.TransactionID, 0); err != nil {
			return err
		}
	}

	// cancel order and restore stock
	if err := s.orderRepo.CancelOrderAndRestoreStock(orderID); err != nil {
		return err
	}

	return nil
}
