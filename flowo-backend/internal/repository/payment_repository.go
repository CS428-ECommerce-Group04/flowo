package repository

import (
	"database/sql"
	"time"

	"flowo-backend/internal/model"
)

type PaymentRepository interface {
	CreatePayment(p *model.Payment) (int, error)
	UpdatePaymentStatus(paymentID int, status, transactionID string, amountPaid float64) error
	UpdatePaymentRawWebhook(paymentID int, raw string) error
	GetPaymentByOrderID(orderID int) (*model.Payment, error)
	GetPaymentByPaymentLinkID(paymentLinkID string) (*model.Payment, error)
}

type paymentRepository struct {
	DB *sql.DB
}

func NewPaymentRepository(db *sql.DB) PaymentRepository {
	return &paymentRepository{DB: db}
}

func (r *paymentRepository) CreatePayment(p *model.Payment) (int, error) {
	res, err := r.DB.Exec(`INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, payment_link_id, checkout_url, raw_webhook, amount_paid, payment_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		p.OrderID, p.PaymentMethod, p.PaymentStatus, p.TransactionID, p.PaymentLinkID, p.CheckoutUrl, p.RawWebhook, p.AmountPaid, time.Now())
	if err != nil {
		return 0, err
	}
	id64, err := res.LastInsertId()
	if err != nil {
		return 0, err
	}
	return int(id64), nil
}

func (r *paymentRepository) UpdatePaymentStatus(paymentID int, status, transactionID string, amountPaid float64) error {
	_, err := r.DB.Exec("UPDATE Payment SET payment_status = ?, transaction_id = ?, amount_paid = ?, payment_date = ? WHERE payment_id = ?", status, transactionID, amountPaid, time.Now(), paymentID)
	return err
}

func (r *paymentRepository) GetPaymentByOrderID(orderID int) (*model.Payment, error) {
	row := r.DB.QueryRow("SELECT payment_id, order_id, payment_method, payment_status, transaction_id, payment_link_id, checkout_url, raw_webhook, amount_paid, payment_date FROM Payment WHERE order_id = ? LIMIT 1", orderID)
	var p model.Payment
	var paymentDate sql.NullTime
	var rawWebhook sql.NullString
	if err := row.Scan(&p.PaymentID, &p.OrderID, &p.PaymentMethod, &p.PaymentStatus, &p.TransactionID, &p.PaymentLinkID, &p.CheckoutUrl, &rawWebhook, &p.AmountPaid, &paymentDate); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if rawWebhook.Valid {
		p.RawWebhook = rawWebhook.String
	}
	if paymentDate.Valid {
		p.PaymentDate = paymentDate.Time
	}
	return &p, nil
}

func (r *paymentRepository) UpdatePaymentRawWebhook(paymentID int, raw string) error {
	_, err := r.DB.Exec("UPDATE Payment SET raw_webhook = ? WHERE payment_id = ?", raw, paymentID)
	return err
}

func (r *paymentRepository) GetPaymentByPaymentLinkID(paymentLinkID string) (*model.Payment, error) {
	row := r.DB.QueryRow("SELECT payment_id, order_id, payment_method, payment_status, transaction_id, payment_link_id, checkout_url, raw_webhook, amount_paid, payment_date FROM Payment WHERE payment_link_id = ? OR transaction_id = ? LIMIT 1", paymentLinkID, paymentLinkID)
	var p model.Payment
	var paymentDate sql.NullTime
	var rawWebhook sql.NullString
	if err := row.Scan(&p.PaymentID, &p.OrderID, &p.PaymentMethod, &p.PaymentStatus, &p.TransactionID, &p.PaymentLinkID, &p.CheckoutUrl, &rawWebhook, &p.AmountPaid, &paymentDate); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	if rawWebhook.Valid {
		p.RawWebhook = rawWebhook.String
	}
	if paymentDate.Valid {
		p.PaymentDate = paymentDate.Time
	}
	return &p, nil
}
