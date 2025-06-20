package repository

import (
	"database/sql"
	"errors"
	"flowo-backend/internal/model"
)

type CartRepository interface {
	GetOrCreateCart(userID int) (int, error)
	AddOrUpdateCartItem(cartID int, productID int, quantity int) error
	UpdateCartItemQuantity(cartID int, productID int, quantity int) error
	RemoveCartItem(cartID int, productID int) error
	GetCartItems(cartID int) ([]model.CartItem, error)
	GetCartIDByUser(userID int) (int, error)
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

func (r *cartRepository) UpdateCartItemQuantity(cartID int, productID int, newQty int) error {
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

	// 1. Get current quantity of the item in the cart
	var currentQty int
	err = tx.QueryRow(`
		SELECT quantity 
		FROM CartItem 
		WHERE cart_id = ? AND product_id = ?`,
		cartID, productID).Scan(&currentQty)
	if err != nil {
		return err
	}

	diff := newQty - currentQty

	// 2. If no change
	if diff == 0 {
		return nil
	}

	// 3. If increase quantity first we check stock
	if diff > 0 {
		var currentStock int
		err = tx.QueryRow(`
			SELECT stock_quantity 
			FROM FlowerProduct 
			WHERE product_id = ?`, productID).Scan(&currentStock)
		if err != nil {
			return err
		}
		if currentStock < diff {
			return errors.New("not enough stock")
		}
		_, err = tx.Exec(`
			UPDATE FlowerProduct 
			SET stock_quantity = stock_quantity - ? 
			WHERE product_id = ?`, diff, productID)
		if err != nil {
			return err
		}
	} else {
		// 4. If decrease quantity, we just update stock
		_, err = tx.Exec(`
			UPDATE FlowerProduct 
			SET stock_quantity = stock_quantity + ? 
			WHERE product_id = ?`, -diff, productID)
		if err != nil {
			return err
		}
	}

	// 5. update status in Flower Product if stock is low
	_, err = tx.Exec(`
	UPDATE FlowerProduct 
	SET status = CASE 
		WHEN stock_quantity < 5 THEN 'LowStock'
		WHEN stock_quantity >= 5 THEN 'NewFlower'
	END 
	WHERE product_id = ?`, productID)
	if err != nil {
		return err
	}

	// 6. Update quantity in CartItem
	_, err = tx.Exec(`
		UPDATE CartItem 
		SET quantity = ? 
		WHERE cart_id = ? AND product_id = ?`,
		newQty, cartID, productID)
	return err
}

func (r *cartRepository) RemoveCartItem(cartID, productID int) error {
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

	// 1. Get currrent quantity of the item in the cart
	var qty int
	err = tx.QueryRow(`
		SELECT quantity FROM CartItem 
		WHERE cart_id = ? AND product_id = ?`, cartID, productID).Scan(&qty)
	if err != nil {
		return err
	}

	// 2. delete cart item
	_, err = tx.Exec(`
		DELETE FROM CartItem 
		WHERE cart_id = ? AND product_id = ?`, cartID, productID)
	if err != nil {
		return err
	}

	// 3. increase stock quantity in Flower Product
	_, err = tx.Exec(`
		UPDATE FlowerProduct 
		SET stock_quantity = stock_quantity + ? 
		WHERE product_id = ?`, qty, productID)

	//4. Update status
	_, err = tx.Exec(`
		UPDATE FlowerProduct 
		SET status = 'NewFlower' 
		WHERE product_id = ? AND stock_quantity > 5`, productID)
	if err != nil {
		return err
	}

	return err
}

func (r *cartRepository) GetCartItems(cartID int) ([]model.CartItem, error) {
	rows, err := r.DB.Query(`
        SELECT cart_item_id, product_id, quantity, added_at 
        FROM CartItem 
        WHERE cart_id = ?`, cartID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.CartItem
	for rows.Next() {
		var item model.CartItem
		item.CartID = cartID
		if err := rows.Scan(&item.CartItemID, &item.ProductID, &item.Quantity, &item.AddedAt); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func (r *cartRepository) GetCartIDByUser(userID int) (int, error) {
	var cartID int
	err := r.DB.QueryRow("SELECT cart_id FROM Cart WHERE user_id = ?", userID).Scan(&cartID)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	return cartID, nil
}
