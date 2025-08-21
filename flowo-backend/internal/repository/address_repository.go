package repository

import (
	"database/sql"
	"errors"
	"flowo-backend/internal/model"
)

type AddressRepository interface {
	Create(address *model.Address) (int, error)
	GetAllByUser(uid string) ([]model.Address, error)
	Delete(uid string, addressID int) error
	ClearDefault(uid string) error
	SetDefault(uid string, addressID int) error
	GetDefault(uid string) (*model.Address, error)
}

type addressRepository struct {
	db *sql.DB
}

func NewAddressRepository(db *sql.DB) AddressRepository {
	return &addressRepository{db: db}
}

func (r *addressRepository) Create(address *model.Address) (int, error) {
	query := `INSERT INTO Address 
		(firebase_uid, recipient_name, phone_number, street_address, city, postal_code, country, is_default_shipping) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	result, err := r.db.Exec(query,
		address.FirebaseUID,
		address.RecipientName,
		address.PhoneNumber,
		address.StreetAddress,
		address.City,
		address.PostalCode,
		address.Country,
		address.IsDefaultShipping,
	)
	if err != nil {
		return 0, err
	}
	id, _ := result.LastInsertId()
	return int(id), nil
}

func (r *addressRepository) GetAllByUser(uid string) ([]model.Address, error) {
	query := `SELECT * FROM Address WHERE firebase_uid = ?`
	rows, err := r.db.Query(query, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var addresses []model.Address
	for rows.Next() {
		var addr model.Address
		if err := rows.Scan(
			&addr.AddressID,
			&addr.FirebaseUID,
			&addr.RecipientName,
			&addr.PhoneNumber,
			&addr.StreetAddress,
			&addr.City,
			&addr.PostalCode,
			&addr.Country,
			&addr.IsDefaultShipping,
		); err != nil {
			return nil, err
		}
		addresses = append(addresses, addr)
	}
	return addresses, nil
}

func (r *addressRepository) Delete(uid string, addressID int) error {
	query := `DELETE FROM Address WHERE firebase_uid = ? AND address_id = ?`
	result, err := r.db.Exec(query, uid, addressID)
	if err != nil {
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("address not found or not belongs to user")
	}
	return nil
}

// Clear default
func (r *addressRepository) ClearDefault(uid string) error {
	_, err := r.db.Exec(`UPDATE Address SET is_default_shipping = false WHERE firebase_uid = ?`, uid)
	return err
}

// Set default
func (r *addressRepository) SetDefault(uid string, addressID int) error {
	query := `UPDATE Address SET is_default_shipping = true WHERE firebase_uid = ? AND address_id = ?`
	result, err := r.db.Exec(query, uid, addressID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("address not found or not belongs to user")
	}
	return nil
}

func (r *addressRepository) GetDefault(uid string) (*model.Address, error) {
	row := r.db.QueryRow(`
        SELECT address_id, firebase_uid, recipient_name, phone_number,
       			street_address, city, postal_code, country, is_default_shipping
		FROM Address
        WHERE firebase_uid = ? AND is_default_shipping = TRUE
        LIMIT 1
    `, uid)

	var addr model.Address
	err := row.Scan(
		&addr.AddressID,
		&addr.FirebaseUID,
		&addr.RecipientName,
		&addr.PhoneNumber,
		&addr.StreetAddress,
		&addr.City,
		&addr.PostalCode,
		&addr.Country,
		&addr.IsDefaultShipping,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &addr, nil
}
