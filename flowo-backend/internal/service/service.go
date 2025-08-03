package service

import (
	"errors"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
	"math"
	"time"
)

type Service interface {
	CreateTodo(input *dto.TodoCreate) (*model.Todo, error)
	GetAllTodos() ([]model.Todo, error)
	GetTodoByID(id uint) (*model.Todo, error)
	UpdateTodo(id uint, input *dto.TodoCreate) (*model.Todo, error)
	DeleteTodo(id uint) error

	GetAllProducts() ([]model.Product, error)
	GetProductByID(id uint) (*model.Product, error)
	CreateProduct(input *dto.ProductCreate) (*model.Product, error)
	UpdateProduct(id uint, input *dto.ProductCreate) error
	DeleteProduct(id uint) error
	GetProductsByFlowerType(flowerType string) ([]model.Product, error)
	GetAllFlowerTypes() ([]model.FlowerType, error)

	GetAllProductsWithEffectivePrice() ([]dto.ProductResponse, error)
	GetProductByIDWithEffectivePrice(id uint) (*dto.ProductResponse, error)

	// product search and filtering methods
	SearchProducts(query *dto.ProductSearchQuery) (*model.ProductSearchResponse, error)
	GetProductDetails(id uint) (*model.Product, error)
	GetAllOccasions() ([]model.Occasion, error)
	GetSearchFilters() (*model.FilterOptions, error)
}

type service struct {
	repo           repository.Repository
	pricingService *PricingService
}

func NewService(repo repository.Repository, pricingService *PricingService) Service {
	return &service{
		repo:           repo,
		pricingService: pricingService,
	}
}

func (s *service) CreateTodo(input *dto.TodoCreate) (*model.Todo, error) {
	todo := &model.Todo{
		Title:       input.Title,
		Description: input.Description,
		Status:      input.Status,
	}

	if todo.Status == "" {
		todo.Status = "pending"
	}

	err := s.repo.Create(todo)
	if err != nil {
		return nil, err
	}

	return todo, nil
}

func (s *service) GetAllTodos() ([]model.Todo, error) {
	return s.repo.FindAll()
}

func (s *service) GetTodoByID(id uint) (*model.Todo, error) {
	todo, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return todo, nil
}

func (s *service) UpdateTodo(id uint, input *dto.TodoCreate) (*model.Todo, error) {
	todo, err := s.repo.FindByID(id)
	if err != nil {
		return nil, err
	}

	todo.Title = input.Title
	todo.Description = input.Description
	if input.Status != "" {
		todo.Status = input.Status
	}

	err = s.repo.Update(todo)
	if err != nil {
		return nil, err
	}

	return todo, nil
}

func (s *service) DeleteTodo(id uint) error {
	todo, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	if todo == nil {
		return errors.New("todo not found")
	}

	return s.repo.Delete(id)
}

func (s *service) GetAllProducts() ([]model.Product, error) {
	products, err := s.repo.GetAllProducts()
	if err != nil {
		return nil, err
	}
	return products, nil
}

func (s *service) GetProductByID(id uint) (*model.Product, error) {
	product, err := s.repo.GetProductByID(id)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *service) CreateProduct(input *dto.ProductCreate) (*model.Product, error) {
	// Validate input
	if err := s.validateProductInput(input); err != nil {
		return nil, err
	}

	product := &model.Product{
		Name:          input.Name,
		Description:   input.Description,
		FlowerType:    input.FlowerType,
		BasePrice:     input.BasePrice,
		Status:        input.Status,
		StockQuantity: input.StockQuantity,
	}

	err := s.repo.CreateProduct(product)
	if err != nil {
		return nil, err
	}

	return product, nil
}

func (s *service) UpdateProduct(id uint, input *dto.ProductCreate) error {
	// Validate input
	if err := s.validateProductInput(input); err != nil {
		return err
	}

	_, err := s.repo.GetProductByID(id)
	if err != nil {
		//check if the product exists
		if err.Error() == "not found" {
			return errors.New("product not found")
		}
		return err
	}

	err = s.repo.UpdateProduct(id, input)
	if err != nil {
		return err
	}

	return nil
}

func (s *service) DeleteProduct(id uint) error {
	_, err := s.repo.GetProductByID(id)
	if err != nil {
		return err
	}
	return s.repo.DeleteProduct(id)
}

func (s *service) GetProductsByFlowerType(flowerType string) ([]model.Product, error) {
	products, err := s.repo.GetProductsByFlowerType(flowerType)
	if err != nil {
		return nil, err
	}
	return products, nil
}

func (s *service) GetAllFlowerTypes() ([]model.FlowerType, error) {
	flowerTypes, err := s.repo.GetAllFlowerTypes()
	if err != nil {
		return nil, err
	}
	return flowerTypes, nil
}

func ToProductResponse(p model.Product, effectivePrice float64) dto.ProductResponse {
	return dto.ProductResponse{
		ProductID:      p.ProductID,
		Name:           p.Name,
		Description:    p.Description,
		FlowerType:     p.FlowerType,
		BasePrice:      p.BasePrice,
		Status:         p.Status,
		StockQuantity:  p.StockQuantity,
		CreatedAt:      p.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      p.UpdatedAt.Format(time.RFC3339),
		EffectivePrice: effectivePrice,
	}
}

func (s *service) GetAllProductsWithEffectivePrice() ([]dto.ProductResponse, error) {
	products, err := s.repo.GetAllProducts()
	if err != nil {
		return nil, err
	}
	var result []dto.ProductResponse
	for _, p := range products {
		price, err := s.pricingService.GetEffectivePriceCache(p, time.Now())
		if err != nil {
			price = p.BasePrice
		}
		result = append(result, ToProductResponse(p, price))
	}
	return result, nil
}

func (s *service) GetProductByIDWithEffectivePrice(id uint) (*dto.ProductResponse, error) {
	product, err := s.repo.GetProductByID(id)
	if err != nil {
		return nil, err
	}

	price, err := s.pricingService.GetEffectivePrice(*product, time.Now())
	if err != nil {
		price = product.BasePrice
	}

	response := ToProductResponse(*product, price)
	return &response, nil
}

// Enhanced methods for advanced search and filtering

func (s *service) SearchProducts(query *dto.ProductSearchQuery) (*model.ProductSearchResponse, error) {
	// Set defaults for pagination
	if query.Page < 1 {
		query.Page = 1
	}
	if query.Limit < 1 {
		query.Limit = 20
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	// Validate price range
	if query.PriceMin != nil && query.PriceMax != nil && *query.PriceMin > *query.PriceMax {
		return nil, errors.New("minimum price cannot be greater than maximum price")
	}

	// Validate status/condition
	if query.Condition != "" && !s.isValidStatus(query.Condition) {
		return nil, errors.New("invalid product condition")
	}

	// Validate sort option
	if query.SortBy != "" && !s.isValidSortOption(query.SortBy) {
		return nil, errors.New("invalid sort option")
	}

	// Search products
	products, total, err := s.repo.SearchProducts(query)
	if err != nil {
		return nil, err
	}

	// Build pagination info
	pagination := s.buildPaginationInfo(query.Page, query.Limit, total)

	// Get filter options
	filters, err := s.GetSearchFilters()
	if err != nil {
		return nil, err
	}

	response := &model.ProductSearchResponse{
		Products:   products,
		Pagination: *pagination,
		Filters:    *filters,
	}

	return response, nil
}

func (s *service) GetProductDetails(id uint) (*model.Product, error) {
	product, err := s.repo.GetProductDetailByID(id)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *service) GetAllOccasions() ([]model.Occasion, error) {
	occasions, err := s.repo.GetAllOccasions()
	if err != nil {
		return nil, err
	}
	return occasions, nil
}

func (s *service) GetSearchFilters() (*model.FilterOptions, error) {
	// Get flower types
	flowerTypes, err := s.repo.GetAllFlowerTypes()
	if err != nil {
		return nil, err
	}

	// Get occasions
	occasions, err := s.repo.GetAllOccasions()
	if err != nil {
		return nil, err
	}

	// Get price range
	priceRange, err := s.repo.GetPriceRange()
	if err != nil {
		return nil, err
	}

	filters := &model.FilterOptions{
		FlowerTypes: flowerTypes,
		Occasions:   occasions,
		PriceRange:  *priceRange,
	}

	return filters, nil
}

// Helper methods

func (s *service) validateProductInput(input *dto.ProductCreate) error {
	if input.Name == "" {
		return errors.New("product name is required")
	}
	if input.Description == "" {
		return errors.New("product description is required")
	}
	if input.FlowerType == "" {
		return errors.New("flower type is required")
	}
	if input.BasePrice <= 0 {
		return errors.New("base price must be greater than 0")
	}
	if input.StockQuantity < 0 {
		return errors.New("stock quantity cannot be negative")
	}
	if !s.isValidStatus(input.Status) {
		return errors.New("invalid product status")
	}
	return nil
}

func (s *service) isValidStatus(status string) bool {
	validStatuses := []string{"NewFlower", "OldFlower", "LowStock"}
	for _, validStatus := range validStatuses {
		if status == validStatus {
			return true
		}
	}
	return false
}

func (s *service) isValidSortOption(sortBy string) bool {
	validSortOptions := []string{
		"price_asc", "price_desc", "name_asc", "name_desc", "newest", "best_selling",
	}
	for _, validOption := range validSortOptions {
		if sortBy == validOption {
			return true
		}
	}
	return false
}

func (s *service) buildPaginationInfo(page, limit, total int) *model.PaginationInfo {
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	hasNext := page < totalPages
	hasPrev := page > 1

	return &model.PaginationInfo{
		Page:       page,
		Limit:      limit,
		Total:      total,
		TotalPages: totalPages,
		HasNext:    hasNext,
		HasPrev:    hasPrev,
	}
}