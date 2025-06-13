package repository

import (
	"database/sql"
	"errors"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
)

type Repository interface {
	Create(todo *model.Todo) error
	FindAll() ([]model.Todo, error)
	FindByID(id uint) (*model.Todo, error)
	Update(todo *model.Todo) error
	Delete(id uint) error
	GetFlowerTypeID(flowerType string) (uint, error)
	GetAllProducts() ([]model.Product, error)
	GetProductByID(ID uint) (*model.Product, error)
	CreateProduct(product *model.Product) error
	UpdateProduct(id uint, product *dto.ProductCreate) error
	DeleteProduct(ID uint) error
	GetProductsByFlowerType(flowerType string) ([]model.Product, error)
	GetAllFlowerTypes() ([]model.FlowerType, error)
}

type repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) Repository {
	return &repository{db: db}
}

func (r *repository) Create(todo *model.Todo) error {
	query := "INSERT INTO todos (title, description, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())"
	_, err := r.db.Exec(query, todo.Title, todo.Description, todo.Status)
	return err
}

func (r *repository) FindAll() ([]model.Todo, error) {
	query := "SELECT id, title, description, status, created_at, updated_at FROM todos"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var todos []model.Todo
	for rows.Next() {
		var todo model.Todo
		if err := rows.Scan(&todo.ID, &todo.Title, &todo.Description, &todo.Status, &todo.CreatedAt, &todo.UpdatedAt); err != nil {
			return nil, err
		}
		todos = append(todos, todo)
	}

	return todos, nil
}

func (r *repository) FindByID(id uint) (*model.Todo, error) {
	query := "SELECT id, title, description, status, created_at, updated_at FROM todos WHERE id = ?"
	row := r.db.QueryRow(query, id)

	var todo model.Todo
	if err := row.Scan(&todo.ID, &todo.Title, &todo.Description, &todo.Status, &todo.CreatedAt, &todo.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("not found")
		}
		return nil, err
	}

	return &todo, nil
}

func (r *repository) Update(todo *model.Todo) error {
	query := "UPDATE todos SET title = ?, description = ?, status = ?, updated_at = NOW() WHERE id = ?"
	_, err := r.db.Exec(query, todo.Title, todo.Description, todo.Status, todo.ID)
	return err
}

func (r *repository) Delete(id uint) error {
	query := "DELETE FROM todos WHERE id = ?"
	_, err := r.db.Exec(query, id)
	return err
}
func (r *repository) GetFlowerTypeID(flowerType string) (uint, error) {
	query := "SELECT flower_type_id FROM FlowerType WHERE name = ?"
	row := r.db.QueryRow(query, flowerType)
	var flowerTypeID uint
	if err := row.Scan(&flowerTypeID); err != nil {
		if err == sql.ErrNoRows {
			return 0, errors.New("flower type not found")
		}
		return 0, err
	}
	return flowerTypeID, nil
}

func (r *repository) GetAllProducts() ([]model.Product, error) {
	query := "SELECT product_id, name, description, flower_type_id, base_price, status, stock_quantity, created_at, updated_at FROM FlowerProduct"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var products []model.Product
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ProductID, &product.Name, &product.Description, &product.FlowerType, &product.BasePrice, &product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}
func (r *repository) GetProductByID(ID uint) (*model.Product, error) {
	query := "SELECT product_id, name, description, flower_type_id, base_price, status, stock_quantity, created_at, updated_at FROM FlowerProduct WHERE product_id = ?"
	row := r.db.QueryRow(query, ID)
	var product model.Product
	if err := row.Scan(&product.ProductID, &product.Name, &product.Description, &product.FlowerType, &product.BasePrice, &product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("not found")
		}
		return nil, err
	}
	return &product, nil
}

func (r *repository) CreateProduct(product *model.Product) error {
	// First, find the flower type ID based on the name
	flowerTypeID, err := r.GetFlowerTypeID(product.FlowerType)
	if err != nil {
		return err
	}
	query := "INSERT INTO FlowerProduct (name, description, flower_type_id, base_price, status, stock_quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())"
	_, err = r.db.Exec(query, product.Name, product.Description, flowerTypeID, product.BasePrice, product.Status, product.StockQuantity)
	return err
}

func (r *repository) UpdateProduct(id uint, product *dto.ProductCreate) error {
	flowerTypeID, err := r.GetFlowerTypeID(product.FlowerType)
	if err != nil {
		return err
	}
	query := "UPDATE FlowerProduct SET name = ?, description = ?, flower_type_id = ?, base_price = ?, status = ?, stock_quantity = ?, updated_at = NOW() WHERE product_id = ?"
	_, err = r.db.Exec(query, product.Name, product.Description, flowerTypeID, product.BasePrice, product.Status, product.StockQuantity, id)
	return err
}
func (r *repository) DeleteProduct(ID uint) error {
	query := "DELETE FROM FlowerProduct WHERE product_id = ?"
	_, err := r.db.Exec(query, ID)
	return err
}
func (r *repository) GetProductsByFlowerType(flowerType string) ([]model.Product, error) {
	flowerTypeID, err := r.GetFlowerTypeID(flowerType)
	if err != nil {
		return nil, err
	}

	query := "SELECT product_id, name, description, flower_type_id, base_price, status, stock_quantity, created_at, updated_at FROM FlowerProduct WHERE flower_type_id = ?"
	rows, err := r.db.Query(query, flowerTypeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ProductID, &product.Name, &product.Description, &product.FlowerType, &product.BasePrice, &product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}
func (r *repository) GetAllFlowerTypes() ([]model.FlowerType, error) {
	query := "SELECT flower_type_id, name FROM FlowerType"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var flowerTypes []model.FlowerType
	for rows.Next() {
		var flowerType model.FlowerType
		if err := rows.Scan(&flowerType.FlowerTypeID, &flowerType.Name); err != nil {
			return nil, err
		}
		flowerTypes = append(flowerTypes, flowerType)
	}

	return flowerTypes, nil
}
