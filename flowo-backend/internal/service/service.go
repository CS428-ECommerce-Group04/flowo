package service

import (
	"errors"
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
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
		CreatedAt:      p.CreatedAt,
		UpdatedAt:      p.UpdatedAt,
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
