package repository

import (
	"database/sql"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"fmt"
)

type OrderRepository interface {
	GetOrdersByUser(firebaseUID string) ([]model.Order, error)
	UpdateOrderStatus(orderID int, status string, shippingMethod *string) error
	GetOrderByID(orderID int) (*model.Order, error)

	CreateOrderWithItemsAndStock(firebaseUID string, order model.Order, items []dto.CartItemResponse) (int, error)
	GetOrderOwnerID(orderID int) (string, error)
	GetOrderDetailByID(orderID int) (*dto.OrderDetailResponse, error)
	AdminGetOrders(status, userID, startDate, endDate string, limit, offset int) ([]dto.AdminOrderResponse, error)
	GetAdminOrderDetailByID(orderID int) (*dto.AdminOrderDetailResponse, error)
	CancelOrderAndRestoreStock(orderID int) error
}

type orderRepository struct {
	DB *sql.DB
}

func NewOrderRepository(db *sql.DB) OrderRepository {
	return &orderRepository{DB: db}
}

func (r *orderRepository) GetOrdersByUser(firebaseUID string) ([]model.Order, error) {
	rows, err := r.DB.Query(
		"SELECT order_id, firebase_uid, status, order_date, final_total_amount, shipping_method FROM `Order` WHERE firebase_uid = ? ORDER BY order_date DESC",
		firebaseUID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var o model.Order
		if err := rows.Scan(&o.OrderID, &o.FirebaseUID, &o.Status, &o.OrderDate, &o.FinalTotalAmount, &o.ShippingMethod); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *orderRepository) UpdateOrderStatus(orderID int, status string, shippingMethod *string) error {
	query := "UPDATE `Order` SET status = ?"
	args := []interface{}{status}
	if shippingMethod != nil {
		query += ", shipping_method = ?"
		args = append(args, *shippingMethod)
	}
	query += " WHERE order_id = ?"
	args = append(args, orderID)

	_, err := r.DB.Exec(query, args...)
	return err
}

func (r *orderRepository) GetOrderByID(orderID int) (*model.Order, error) {
	query := "SELECT order_id, firebase_uid, status, order_date, final_total_amount, shipping_method FROM `Order` WHERE order_id = ? LIMIT 1"
	row := r.DB.QueryRow(query, orderID)

	var o model.Order
	if err := row.Scan(&o.OrderID, &o.FirebaseUID, &o.Status, &o.OrderDate, &o.FinalTotalAmount, &o.ShippingMethod); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &o, nil
}

func (r *orderRepository) CreateOrderWithItemsAndStock(firebaseUID string, order model.Order, items []dto.CartItemResponse) (int, error) {
	tx, err := r.DB.Begin()
	if err != nil {
		return 0, err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	for _, item := range items {
		if err := r.reduceStock(tx, item.ProductID, item.Quantity); err != nil {
			return 0, err
		}
	}

	orderID, err := r.insertOrder(tx, order)
	if err != nil {
		return 0, err
	}

	if err := r.insertOrderItems(tx, orderID, items); err != nil {
		return 0, err
	}

	return orderID, nil
}

func (r *orderRepository) reduceStock(tx *sql.Tx, productID, quantity int) error {
	var currentStock int
	err := tx.QueryRow("SELECT stock_quantity FROM FlowerProduct WHERE product_id = ?", productID).Scan(&currentStock)
	if err != nil {
		return err
	}
	if currentStock < quantity {
		return fmt.Errorf("not enough stock for product %d", productID)
	}
	_, err = tx.Exec("UPDATE FlowerProduct SET stock_quantity = stock_quantity - ? WHERE product_id = ?", quantity, productID)
	return err
}

func (r *orderRepository) insertOrder(tx *sql.Tx, order model.Order) (int, error) {
	res, err := tx.Exec("INSERT INTO `Order` (firebase_uid, order_date, status, shipping_address_id, billing_address_id, subtotal_amount, discount_amount, shipping_cost, final_total_amount, notes, shipping_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		order.FirebaseUID, order.OrderDate, order.Status,
		order.ShippingAddressID, order.BillingAddressID,
		order.SubtotalAmount, order.DiscountAmount,
		order.ShippingCost, order.FinalTotalAmount,
		order.Notes, order.ShippingMethod)
	if err != nil {
		return 0, err
	}
	orderID64, _ := res.LastInsertId()
	return int(orderID64), nil
}

func (r *orderRepository) insertOrderItems(tx *sql.Tx, orderID int, items []dto.CartItemResponse) error {
	for _, item := range items {
		_, err := tx.Exec(`
			INSERT INTO OrderItem 
			(order_id, product_id, quantity, price_per_unit_at_purchase, item_subtotal)
			VALUES (?, ?, ?, ?, ?)`,
			orderID, item.ProductID, item.Quantity, item.EffectivePrice, item.TotalPrice)
		if err != nil {
			return fmt.Errorf("failed to insert order item for product %d: %v", item.ProductID, err)
		}
	}
	return nil
}

func (r *orderRepository) GetOrderOwnerID(orderID int) (string, error) {
	var firebaseUID string
	err := r.DB.QueryRow("SELECT firebase_uid FROM `Order` WHERE order_id = ?", orderID).Scan(&firebaseUID)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("order not found")
		}
		return "", err
	}
	return firebaseUID, nil
}

func (r *orderRepository) GetOrderDetailByID(orderID int) (*dto.OrderDetailResponse, error) {

	var order dto.OrderDetailResponse
	err := r.DB.QueryRow(" SELECT o.order_id, o.status, o.order_date, o.final_total_amount, o.shipping_method FROM `Order` o WHERE o.order_id = ?", orderID).Scan(&order.OrderID, &order.Status, &order.OrderDate, &order.TotalAmount, &order.ShippingMethod)

	if err != nil {
		return nil, err
	}

	rows, err := r.DB.Query(`
		SELECT product_id, quantity, price_per_unit_at_purchase, item_subtotal
		FROM OrderItem
		WHERE order_id = ?
	`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto.OrderItemDetail
	for rows.Next() {
		var item dto.OrderItemDetail
		err := rows.Scan(&item.ProductID, &item.Quantity, &item.Price, &item.Subtotal)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	order.Items = items
	return &order, nil
}

func (r *orderRepository) AdminGetOrders(status, firebaseUID, startDate, endDate string, limit, offset int) ([]dto.AdminOrderResponse, error) {
	query := "SELECT order_id, firebase_uid, final_total_amount, status, order_date FROM `Order` WHERE (status = ? OR ? = '') AND (firebase_uid = ? OR ? = '') AND (order_date >= ? OR ? = '') AND (order_date <= ? OR ? = '') ORDER BY order_date DESC LIMIT ? OFFSET ?"

	rows, err := r.DB.Query(query, status, status, firebaseUID, firebaseUID, startDate, startDate, endDate, endDate, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []dto.AdminOrderResponse
	for rows.Next() {
		var o dto.AdminOrderResponse
		if err := rows.Scan(&o.OrderID, &o.FirebaseUID, &o.TotalAmount, &o.Status, &o.OrderDate); err != nil {
			return nil, err
		}
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *orderRepository) GetAdminOrderDetailByID(orderID int) (*dto.AdminOrderDetailResponse, error) {
	var order dto.AdminOrderDetailResponse
	err := r.DB.QueryRow("SELECT o.order_id, o.status, o.order_date, o.final_total_amount, o.shipping_method, IFNULL(o.customer_name, ''), IFNULL(o.customer_email, '') FROM `Order` o WHERE o.order_id = ?", orderID).
		Scan(
			&order.OrderID,
			&order.Status,
			&order.OrderDate,
			&order.TotalAmount,
			&order.ShippingMethod,
			&order.CustomerName,
			&order.CustomerEmail,
		)
	if err != nil {
		return nil, err
	}

	rows, err := r.DB.Query(`
		SELECT product_id, quantity, price_per_unit_at_purchase, item_subtotal
		FROM OrderItem
		WHERE order_id = ?
	`, orderID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []dto.OrderItemDetail
	for rows.Next() {
		var item dto.OrderItemDetail
		err := rows.Scan(&item.ProductID, &item.Quantity, &item.Price, &item.Subtotal)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	order.Items = items

	return &order, nil
}

func (r *orderRepository) CancelOrderAndRestoreStock(orderID int) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	// get order items
	rows, err := tx.Query("SELECT product_id, quantity FROM OrderItem WHERE order_id = ?", orderID)
	if err != nil {
		return err
	}
	defer rows.Close()

	for rows.Next() {
		var productID, qty int
		if err := rows.Scan(&productID, &qty); err != nil {
			return err
		}
		if _, err := tx.Exec("UPDATE FlowerProduct SET stock_quantity = stock_quantity + ? WHERE product_id = ?", qty, productID); err != nil {
			return err
		}
	}

	// update order status to cancelled
	if _, err := tx.Exec("UPDATE `Order` SET status = ? WHERE order_id = ?", "CANCELLED", orderID); err != nil {
		return err
	}

	return nil
}
