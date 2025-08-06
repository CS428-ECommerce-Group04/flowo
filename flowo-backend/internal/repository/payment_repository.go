package repository

import (
	"database/sql"
	"flowo-backend/internal/model"
)

type PaymentRepository interface {
	CreatePayment(payment model.Payment) (int, error)
	GetPaymentByID(paymentID int) (*model.Payment, error)
	GetPaymentsByOrderID(orderID int) ([]model.Payment, error)
	UpdatePaymentStatus(paymentID int, status string, transactionID string) error
	GetPaymentByTransactionRef(txnRef string) (*model.Payment, error)
}

type paymentRepository struct {
	DB *sql.DB
}

func NewPaymentRepository(db *sql.DB) PaymentRepository {
	return &paymentRepository{DB: db}
}

func (r *paymentRepository) CreatePayment(payment model.Payment) (int, error) {
	query := `
		INSERT INTO Payment (order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	result, err := r.DB.Exec(query,
		payment.OrderID,
		payment.PaymentMethod,
		payment.PaymentStatus,
		payment.TransactionID,
		payment.AmountPaid,
		payment.PaymentDate,
	)

	if err != nil {
		return 0, err
	}

	paymentID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(paymentID), nil
}

func (r *paymentRepository) GetPaymentByID(paymentID int) (*model.Payment, error) {
	query := `
		SELECT payment_id, order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date
		FROM Payment
		WHERE payment_id = ?
	`

	var payment model.Payment
	err := r.DB.QueryRow(query, paymentID).Scan(
		&payment.PaymentID,
		&payment.OrderID,
		&payment.PaymentMethod,
		&payment.PaymentStatus,
		&payment.TransactionID,
		&payment.AmountPaid,
		&payment.PaymentDate,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &payment, nil
}

func (r *paymentRepository) GetPaymentsByOrderID(orderID int) ([]model.Payment, error) {
	query := `
		SELECT payment_id, order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date
		FROM Payment
		WHERE order_id = ?
		ORDER BY payment_date DESC
	`

	rows, err := r.DB.Query(query, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []model.Payment
	for rows.Next() {
		var payment model.Payment
		err := rows.Scan(
			&payment.PaymentID,
			&payment.OrderID,
			&payment.PaymentMethod,
			&payment.PaymentStatus,
			&payment.TransactionID,
			&payment.AmountPaid,
			&payment.PaymentDate,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	return payments, nil
}

func (r *paymentRepository) UpdatePaymentStatus(paymentID int, status string, transactionID string) error {
	query := `
		UPDATE Payment 
		SET payment_status = ?, transaction_id = ?
		WHERE payment_id = ?
	`

	_, err := r.DB.Exec(query, status, transactionID, paymentID)
	return err
}

func (r *paymentRepository) GetPaymentByTransactionRef(txnRef string) (*model.Payment, error) {
	query := `
		SELECT payment_id, order_id, payment_method, payment_status, transaction_id, amount_paid, payment_date
		FROM Payment
		WHERE transaction_id = ?
	`

	var payment model.Payment
	err := r.DB.QueryRow(query, txnRef).Scan(
		&payment.PaymentID,
		&payment.OrderID,
		&payment.PaymentMethod,
		&payment.PaymentStatus,
		&payment.TransactionID,
		&payment.AmountPaid,
		&payment.PaymentDate,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &payment, nil
}
