package repository

import (
	"database/sql"
	"errors"
	"strings"

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
	GetProductByID(id uint) (*model.Product, error)
	CreateProduct(product *model.Product) error
	UpdateProduct(id uint, product *dto.ProductCreate) error
	DeleteProduct(id uint) error
	GetProductsByFlowerType(flowerType string) ([]model.Product, error)
	GetAllFlowerTypes() ([]model.FlowerType, error)
	GetProductsByIDs(ids []int) (map[int]model.Product, error)

	// product search and filtering methods
	SearchProducts(query *dto.ProductSearchQuery) ([]model.Product, int, error)
	GetProductDetailByID(id uint) (*model.Product, error)
	GetProductImages(productID uint) ([]model.ProductImage, error)
	GetProductOccasions(productID uint) ([]string, error)
	GetAllOccasions() ([]model.Occasion, error)
	GetPriceRange() (*model.PriceRange, error)
	GetProductStatistics(productID uint) (averageRating float64, reviewCount int, salesRank int, error error)

	// User repository methods
	CreateUser(user *model.User) error
	GetUserByFirebaseUID(firebaseUID string) (*model.User, error)
	GetUserByEmail(email string) (*model.User, error)
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
	query := `SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			  fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			  fp.created_at, fp.updated_at
			  FROM FlowerProduct fp 
			  JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, product)
	}
	return products, nil
}

func (r *repository) GetProductByID(id uint) (*model.Product, error) {
	query := `SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			  fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			  fp.created_at, fp.updated_at
			  FROM FlowerProduct fp 
			  JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id 
			  WHERE fp.product_id = ?`
	row := r.db.QueryRow(query, id)

	var product model.Product
	if err := row.Scan(&product.ProductID, &product.Name, &product.Description,
		&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
		&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("not found")
		}
		return nil, err
	}
	return &product, nil
}

func (r *repository) CreateProduct(product *model.Product) error {
	// First, find the flower type id based on the name
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

func (r *repository) DeleteProduct(id uint) error {
	query := "DELETE FROM FlowerProduct WHERE product_id = ?"
	_, err := r.db.Exec(query, id)
	return err
}

func (r *repository) GetProductsByFlowerType(flowerType string) ([]model.Product, error) {
	flowerTypeID, err := r.GetFlowerTypeID(flowerType)
	if err != nil {
		return nil, err
	}

	query := `SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			  fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			  fp.created_at, fp.updated_at
			  FROM FlowerProduct fp 
			  JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id 
			  WHERE fp.flower_type_id = ?`
	rows, err := r.db.Query(query, flowerTypeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt); err != nil {
			return nil, err
		}
		products = append(products, product)
	}

	return products, nil
}

func (r *repository) GetAllFlowerTypes() ([]model.FlowerType, error) {
	query := "SELECT flower_type_id, name, description FROM FlowerType"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var flowerTypes []model.FlowerType
	for rows.Next() {
		var flowerType model.FlowerType
		var description sql.NullString
		if err := rows.Scan(&flowerType.FlowerTypeID, &flowerType.Name, &description); err != nil {
			return nil, err
		}
		if description.Valid {
			flowerType.Description = description.String
		}
		flowerTypes = append(flowerTypes, flowerType)
	}

	return flowerTypes, nil
}

func (r *repository) GetProductsByIDs(ids []int) (map[int]model.Product, error) {
	if len(ids) == 0 {
		return map[int]model.Product{}, nil
	}

	placeholders := "?" + strings.Repeat(",?", len(ids)-1)
	query := `
		SELECT p.product_id, p.name, p.description, p.base_price, p.status, p.stock_quantity,
		       p.created_at, p.updated_at, f.name AS flower_type
		FROM FlowerProduct p
		JOIN FlowerType f ON p.flower_type_id = f.flower_type_id
		WHERE p.product_id IN (` + placeholders + `)`

	args := make([]interface{}, len(ids))
	for i, id := range ids {
		args[i] = id
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make(map[int]model.Product)
	for rows.Next() {
		var p model.Product
		err := rows.Scan(
			&p.ProductID, &p.Name, &p.Description, &p.BasePrice, &p.Status,
			&p.StockQuantity, &p.CreatedAt, &p.UpdatedAt, &p.FlowerType,
		)
		if err != nil {
			return nil, err
		}
		products[int(p.ProductID)] = p
	}

	return products, nil
}

// Enhanced methods for advanced search and filtering

func (r *repository) SearchProducts(query *dto.ProductSearchQuery) ([]model.Product, int, error) {
	// Build the base query (simplified version without complex subqueries)
	baseQuery := `
		SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at,
			   0 as average_rating,
			   0 as review_count,
			   999999 as sales_rank
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id`

	var conditions []string
	var args []interface{}

	// Build WHERE conditions
	if query.Query != "" {
		conditions = append(conditions, "(fp.name LIKE ? OR fp.description LIKE ?)")
		searchTerm := "%" + query.Query + "%"
		args = append(args, searchTerm, searchTerm)
	}

	if query.FlowerType != "" {
		conditions = append(conditions, "ft.name = ?")
		args = append(args, query.FlowerType)
	}

	if query.Occasion != "" {
		baseQuery += " JOIN ProductOccasion po ON fp.product_id = po.product_id JOIN Occasion oc ON po.occasion_id = oc.occasion_id"
		conditions = append(conditions, "oc.name = ?")
		args = append(args, query.Occasion)
	}

	if query.PriceMin != nil {
		conditions = append(conditions, "fp.base_price >= ?")
		args = append(args, *query.PriceMin)
	}

	if query.PriceMax != nil {
		conditions = append(conditions, "fp.base_price <= ?")
		args = append(args, *query.PriceMax)
	}

	if query.Condition != "" {
		conditions = append(conditions, "fp.status = ?")
		args = append(args, query.Condition)
	}

	// Add WHERE clause if there are conditions
	if len(conditions) > 0 {
		baseQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	// Add ORDER BY
	orderBy := r.buildOrderByClause(query.SortBy)
	baseQuery += " ORDER BY " + orderBy

	// Count total results with a simplified count query
	countQuery := "SELECT COUNT(*) FROM FlowerProduct fp JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id"
	if query.Occasion != "" {
		countQuery += " JOIN ProductOccasion po ON fp.product_id = po.product_id JOIN Occasion oc ON po.occasion_id = oc.occasion_id"
	}
	if len(conditions) > 0 {
		countQuery += " WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.db.QueryRow(countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	// Add pagination
	page := query.Page
	if page < 1 {
		page = 1
	}
	limit := query.Limit
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	offset := (page - 1) * limit
	baseQuery += " LIMIT ? OFFSET ?"
	args = append(args, limit, offset)

	// Execute the query
	rows, err := r.db.Query(baseQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var products []model.Product
	for rows.Next() {
		var product model.Product
		if err := rows.Scan(&product.ProductID, &product.Name, &product.Description,
			&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
			&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt,
			&product.AverageRating, &product.ReviewCount, &product.SalesRank); err != nil {
			return nil, 0, err
		}
		products = append(products, product)
	}

	return products, total, nil
}

func (r *repository) buildOrderByClause(sortBy string) string {
	switch sortBy {
	case "price_asc":
		return "fp.base_price ASC"
	case "price_desc":
		return "fp.base_price DESC"
	case "name_asc":
		return "fp.name ASC"
	case "name_desc":
		return "fp.name DESC"
	case "newest":
		return "fp.created_at DESC"
	case "best_selling":
		return "sales_rank ASC, fp.created_at DESC"
	default:
		return "fp.created_at DESC" // Default to newest
	}
}

func (r *repository) GetProductDetailByID(id uint) (*model.Product, error) {
	// Get basic product information with ratings and sales rank
	query := `
		SELECT fp.product_id, fp.name, fp.description, ft.name as flower_type, 
			   fp.base_price, fp.base_price as current_price, fp.status, fp.stock_quantity, 
			   fp.created_at, fp.updated_at,
			   COALESCE(AVG(r.rating), 0) as average_rating,
			   COUNT(r.review_id) as review_count,
			   COALESCE(sales_data.sales_rank, 999999) as sales_rank
		FROM FlowerProduct fp 
		JOIN FlowerType ft ON fp.flower_type_id = ft.flower_type_id
		LEFT JOIN Review r ON fp.product_id = r.product_id
		LEFT JOIN (
			SELECT oi.product_id, ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity) DESC) as sales_rank
			FROM OrderItem oi
			JOIN ` + "`Order`" + ` o ON oi.order_id = o.order_id
			WHERE o.status = 'Completed'
			GROUP BY oi.product_id
		) sales_data ON fp.product_id = sales_data.product_id
		WHERE fp.product_id = ?
		GROUP BY fp.product_id, fp.name, fp.description, ft.name, fp.base_price, 
				 fp.status, fp.stock_quantity, fp.created_at, fp.updated_at, sales_data.sales_rank`

	row := r.db.QueryRow(query, id)

	var product model.Product
	if err := row.Scan(&product.ProductID, &product.Name, &product.Description,
		&product.FlowerType, &product.BasePrice, &product.CurrentPrice,
		&product.Status, &product.StockQuantity, &product.CreatedAt, &product.UpdatedAt,
		&product.AverageRating, &product.ReviewCount, &product.SalesRank); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("not found")
		}
		return nil, err
	}

	// Get product images
	images, err := r.GetProductImages(id)
	if err != nil {
		return nil, err
	}
	product.Images = images

	// Get product occasions
	occasions, err := r.GetProductOccasions(id)
	if err != nil {
		return nil, err
	}
	product.Occasions = occasions

	return &product, nil
}

func (r *repository) GetProductImages(productID uint) ([]model.ProductImage, error) {
	query := "SELECT image_id, product_id, image_url, alt_text, is_primary FROM ProductImage WHERE product_id = ? ORDER BY is_primary DESC, image_id ASC"
	rows, err := r.db.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []model.ProductImage
	for rows.Next() {
		var image model.ProductImage
		if err := rows.Scan(&image.ImageID, &image.ProductID, &image.ImageURL, &image.AltText, &image.IsPrimary); err != nil {
			return nil, err
		}
		images = append(images, image)
	}

	return images, nil
}

func (r *repository) GetProductOccasions(productID uint) ([]string, error) {
	query := `SELECT o.name FROM ProductOccasion po 
			  JOIN Occasion o ON po.occasion_id = o.occasion_id 
			  WHERE po.product_id = ?`
	rows, err := r.db.Query(query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var occasions []string
	for rows.Next() {
		var occasion string
		if err := rows.Scan(&occasion); err != nil {
			return nil, err
		}
		occasions = append(occasions, occasion)
	}

	return occasions, nil
}

func (r *repository) GetAllOccasions() ([]model.Occasion, error) {
	query := "SELECT occasion_id, name FROM Occasion ORDER BY name"
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var occasions []model.Occasion
	for rows.Next() {
		var occasion model.Occasion
		if err := rows.Scan(&occasion.OccasionID, &occasion.Name); err != nil {
			return nil, err
		}
		occasions = append(occasions, occasion)
	}

	return occasions, nil
}

func (r *repository) GetPriceRange() (*model.PriceRange, error) {
	query := "SELECT MIN(base_price), MAX(base_price) FROM FlowerProduct WHERE stock_quantity > 0"
	row := r.db.QueryRow(query)

	var priceRange model.PriceRange
	if err := row.Scan(&priceRange.Min, &priceRange.Max); err != nil {
		return nil, err
	}

	return &priceRange, nil
}

func (r *repository) GetProductStatistics(productID uint) (averageRating float64, reviewCount int, salesRank int, error error) {
	// Get rating statistics
	ratingQuery := "SELECT COALESCE(AVG(rating), 0), COUNT(*) FROM Review WHERE product_id = ?"
	if err := r.db.QueryRow(ratingQuery, productID).Scan(&averageRating, &reviewCount); err != nil {
		return 0, 0, 0, err
	}

	// Get sales rank
	salesQuery := `
		SELECT COALESCE(ranking.rank, 999999) FROM (
			SELECT oi.product_id, ROW_NUMBER() OVER (ORDER BY SUM(oi.quantity) DESC) as rank
			FROM OrderItem oi
			JOIN ` + "`Order`" + ` o ON oi.order_id = o.order_id
			WHERE o.status = 'Completed'
			GROUP BY oi.product_id
		) ranking WHERE ranking.product_id = ?`

	if err := r.db.QueryRow(salesQuery, productID).Scan(&salesRank); err != nil {
		if err == sql.ErrNoRows {
			salesRank = 999999 // No sales yet
		} else {
			return 0, 0, 0, err
		}
	}

	return averageRating, reviewCount, salesRank, nil
}

// CreateUser creates a new user in the database
func (r *repository) CreateUser(user *model.User) error {
	query := `
		INSERT INTO User (firebase_uid, email, username, full_name, gender, role, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
	`

	result, err := r.db.Exec(query, user.FirebaseUID, user.Email, user.Username, user.FullName, user.Gender, user.Role)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	user.UserID = int(id)
	return nil
}

// GetUserByFirebaseUID retrieves a user by their Firebase UID
func (r *repository) GetUserByFirebaseUID(firebaseUID string) (*model.User, error) {
	query := `
		SELECT user_id, firebase_uid, email, username, full_name, gender, role, created_at, updated_at
		FROM User
		WHERE firebase_uid = ?
	`

	var user model.User
	err := r.db.QueryRow(query, firebaseUID).Scan(
		&user.UserID,
		&user.FirebaseUID,
		&user.Email,
		&user.Username,
		&user.FullName,
		&user.Gender,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}

	return &user, nil
}

// GetUserByEmail retrieves a user by their email
func (r *repository) GetUserByEmail(email string) (*model.User, error) {
	query := `
		SELECT user_id, firebase_uid, email, username, full_name, gender, role, created_at, updated_at
		FROM User
		WHERE email = ?
	`

	var user model.User
	err := r.db.QueryRow(query, email).Scan(
		&user.UserID,
		&user.FirebaseUID,
		&user.Email,
		&user.Username,
		&user.FullName,
		&user.Gender,
		&user.Role,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // User not found
		}
		return nil, err
	}

	return &user, nil
}
