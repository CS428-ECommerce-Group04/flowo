package repository

import (
	"database/sql"
	"errors"
)

type CartRepository interface {
	GetOrCreateCart(userID int) (int, error)
	AddOrUpdateCartItem(cartID int, productID int, quantity int) error
}

type cartRepository struct {
	DB *sql.DB
}

func NewCartRepository(db *sql.DB) CartRepository {
	return &cartRepository{DB: db}
}

func (r *cartRepository) GetOrCreateCart(userID int) (int, error) {
	var cartID int
	err := r.DB.QueryRow("SELECT cart_id FROM Cart WHERE user_id = ?", userID).Scan(&cartID)
	if err == sql.ErrNoRows {
		res, err := r.DB.Exec("INSERT INTO Cart (user_id) VALUES (?)", userID)
		if err != nil {
			return 0, err
		}
		insertedID, _ := res.LastInsertId()
		return int(insertedID), nil
	}
	return cartID, err
}

func (r *cartRepository) AddOrUpdateCartItem(cartID int, productID int, quantity int) error {
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

	// 1. Check current stock in Flower Product
	var currentStock int
	err = tx.QueryRow(`
        SELECT stock_quantity 
        FROM FlowerProduct 
        WHERE product_id = ?`, productID).Scan(&currentStock)
	if err != nil {
		return err
	}
	if currentStock < quantity {
		return errors.New("not enough stock")
	}

	// 2. Decrease stock quantity in Flower Product
	_, err = tx.Exec(`
        UPDATE FlowerProduct 
        SET stock_quantity = stock_quantity - ? 
        WHERE product_id = ?`, quantity, productID)
	if err != nil {
		return err
	}

	// 3. Update status in Flower Product if stock is low
	_, err = tx.Exec(`
        UPDATE FlowerProduct 
        SET status = 'LowStock' 
        WHERE product_id = ? AND stock_quantity < 5`, productID)
	if err != nil {
		return err
	}

	// 4. Check if CartItem already exists
	var existingQty int
	err = tx.QueryRow(`
        SELECT quantity 
        FROM CartItem 
        WHERE cart_id = ? AND product_id = ?`, cartID, productID).Scan(&existingQty)

	if err == sql.ErrNoRows {
		// 5. if not exists, insert new CartItem
		_, err = tx.Exec(`
            INSERT INTO CartItem (cart_id, product_id, quantity) 
            VALUES (?, ?, ?)`, cartID, productID, quantity)
		return err
	} else if err != nil {
		return err
	}

	// 6. If exists, update quantity in CartItem
	_, err = tx.Exec(`
        UPDATE CartItem 
        SET quantity = quantity + ? 
        WHERE cart_id = ? AND product_id = ?`,
		quantity, cartID, productID)
	return err
}
