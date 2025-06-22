package controller

import (
	"net/http"
	"strconv"

	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

type Controller struct {
	service service.Service
}

func NewController(service service.Service) *Controller {
	return &Controller{
		service: service,
	}
}

func (c *Controller) RegisterRoutes(router *gin.Engine) {
	router.GET("/health", c.HealthCheck)
	v1 := router.Group("/api/v1")
	{
		todos := v1.Group("/todos")
		{
			todos.GET("", c.GetAllTodos)
			todos.GET("/:id", c.GetTodoByID)
			todos.POST("", c.CreateTodo)
			todos.PUT("/:id", c.UpdateTodo)
			todos.DELETE("/:id", c.DeleteTodo)
		}
		
		// Enhanced product routes
		products := v1.Group("/products")
		{
			products.GET("", c.GetAllProducts)                    // Basic product listing
			products.GET("/search", c.SearchProducts)             // Advanced search with filters
			products.GET("/filters", c.GetProductFilters)         // Get available filter options
			products.GET("/:id", c.GetProductDetails)             // Enhanced product details
		}
		
		// Legacy single product routes (maintain backward compatibility)
		product := v1.Group("/product")
		{
			product.GET("/:id", c.GetProductByID)
			product.GET("/flower-type/:flower_type", c.GetProductsByFlowerType)
			product.POST("", c.CreateProduct)
			product.PUT("/:id", c.UpdateProduct)
			product.DELETE("/:id", c.DeleteProduct)
		}
		
		// Catalog routes
		v1.GET("flower-types", c.GetAllFlowerTypes)
		v1.GET("occasions", c.GetAllOccasions)
	}
}

// HealthCheck godoc
// @Summary Show the status of server.
// @Description get the status of server.
// @Tags health
// @Accept */*
// @Produce json
// @Success 200 {object} model.Response
// @Router /health [get]
func (x *Controller) HealthCheck(ctx *gin.Context) {
	log.Info().Msg("Health check")
	ctx.JSON(http.StatusOK, model.NewResponse("OK", nil))
}

// GetAllTodos godoc
// @Summary Get all todos
// @Description get all todos
// @Tags todos
// @Accept json
// @Produce json
// @Success 200 {object} model.Response{data=[]model.Todo}
// @Failure 500 {object} model.Response
// @Router /api/v1/todos [get]
func (c *Controller) GetAllTodos(ctx *gin.Context) {
	todos, err := c.service.GetAllTodos()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch todos", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Todos fetched successfully", todos))
}

// GetTodoByID godoc
// @Summary Get a todo
// @Description get todo by ID
// @Tags todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Success 200 {object} model.Response{data=model.Todo}
// @Failure 400 {object} model.Response
// @Failure 404 {object} model.Response
// @Router /api/v1/todos/{id} [get]
func (c *Controller) GetTodoByID(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	todo, err := c.service.GetTodoByID(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, model.NewResponse("Todo not found", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Todo fetched successfully", todo))
}

// CreateTodo godoc
// @Summary Create a todo
// @Description create new todo
// @Tags todos
// @Accept json
// @Produce json
// @Param todo body dto.TodoCreate true "Create todo"
// @Success 201 {object} model.Response{data=model.Todo}
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/todos [post]
func (c *Controller) CreateTodo(ctx *gin.Context) {
	var input dto.TodoCreate
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid input", nil))
		return
	}

	todo, err := c.service.CreateTodo(&input)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to create todo", nil))
		return
	}

	ctx.JSON(http.StatusCreated, model.NewResponse("Todo created successfully", todo))
}

// UpdateTodo godoc
// @Summary Update a todo
// @Description update todo by ID
// @Tags todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Param todo body dto.TodoCreate true "Update todo"
// @Success 200 {object} model.Response{data=model.Todo}
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/todos/{id} [put]
func (c *Controller) UpdateTodo(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	var input dto.TodoCreate
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid input", nil))
		return
	}

	todo, err := c.service.UpdateTodo(uint(id), &input)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to update todo", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Todo updated successfully", todo))
}

// DeleteTodo godoc
// @Summary Delete a todo
// @Description delete todo by ID
// @Tags todos
// @Accept json
// @Produce json
// @Param id path int true "Todo ID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/todos/{id} [delete]
func (c *Controller) DeleteTodo(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	if err := c.service.DeleteTodo(uint(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to delete todo", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Todo deleted successfully", nil))
}

// GetAllProducts godoc
// @Summary Get all products
// @Description get all products
// @Tags products
// @Accept json
// @Produce json
// @Success 200 {object} model.Response{data=[]model.Product}
// @Failure 500 {object} model.Response
// @Router /api/v1/products [get]
func (c *Controller) GetAllProducts(ctx *gin.Context) {
	products, err := c.service.GetAllProductsWithEffectivePrice()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch products", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Products fetched successfully", products))
}

// GetProductByID godoc
// @Summary Get a product
// @Description get product by ID
// @Tags products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Success 200 {object} model.Response{data=model.Product}
// @Failure 400 {object} model.Response
// @Failure 404 {object} model.Response
// @Router /api/v1/product/{id} [get]
func (c *Controller) GetProductByID(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	product, err := c.service.GetProductByIDWithEffectivePrice(uint(id))
	if err != nil {
		ctx.JSON(http.StatusNotFound, model.NewResponse("Product not found", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Product fetched successfully", product))
}

// CreateProduct godoc
// @Summary Create a product
// @Description create new product
// @Tags products
// @Accept json
// @Produce json
// @Param product body dto.ProductCreate true "Create product"
// @Success 201 {object} model.Response{data=model.Product}
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/product [post]
func (c *Controller) CreateProduct(ctx *gin.Context) {
	var input dto.ProductCreate
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid input", nil))
		return
	}

	product, err := c.service.CreateProduct(&input)
	if err != nil {
		if err.Error() == "flower type not found" {
			ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid flower type", nil))
			return
		}
		log.Error().Err(err).Msg("Failed to create product")
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to create product", nil))
		return
	}

	ctx.JSON(http.StatusCreated, model.NewResponse("Product created successfully", product))
}

// UpdateProduct godoc
// @Summary Update a product
// @Description update product by ID
// @Tags products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Param product body dto.ProductCreate true "Update product"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/product/{id} [put]
func (c *Controller) UpdateProduct(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	var input dto.ProductCreate
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid input", nil))
		return
	}

	err = c.service.UpdateProduct(uint(id), &input)
	if err != nil {
		if err.Error() == "flower type not found" {
			ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid flower type", nil))
			return
		}
		if err.Error() == "product not found" {
			ctx.JSON(http.StatusNotFound, model.NewResponse("Product not found", nil))
			return
		}
		log.Error().Err(err).Msg("Failed to update product")
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to update product", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Product updated successfully", nil))
}

// DeleteProduct godoc
// @Summary Delete a product
// @Description delete product by ID
// @Tags products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 404 {object} model.Response
// @Router /api/v1/product/{id} [delete]
func (c *Controller) DeleteProduct(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	if err := c.service.DeleteProduct(uint(id)); err != nil {
		if err.Error() == "not found" {
			ctx.JSON(http.StatusNotFound, model.NewResponse("Product not found", nil))
			return
		}
		log.Error().Err(err).Msg("Failed to delete product")

		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to delete product", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Product deleted successfully", nil))
}

// GetProductsByFlowerType godoc
// @Summary Get products by flower type
// @Description get products by flower type
// @Tags products
// @Accept json
// @Produce json
// @Param flower_type path string true "Flower Type"
// @Success 200 {object} model.Response{data=[]model.Product}
// @Failure 400 {object} model.Response
// @Failure 404 {object} model.Response
// @Router /api/v1/product/flower-type/{flower_type} [get]
func (c *Controller) GetProductsByFlowerType(ctx *gin.Context) {
	flowerType := ctx.Param("flower_type")
	if flowerType == "" {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Flower type is required", nil))
		return
	}

	products, err := c.service.GetProductsByFlowerType(flowerType)
	if err != nil {
		if err.Error() == "flower type not found" {
			ctx.JSON(http.StatusNotFound, model.NewResponse("Invalid flower type", nil))
			return
		}
		log.Error().Err(err).Msg("Failed to fetch products by flower type")
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch products", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Products fetched successfully", products))
}

// GetAllFlowerTypes godoc
// @Summary Get all flower types
// @Description get all flower types
// @Tags flower-types
// @Accept json
// @Produce json
// @Success 200 {object} model.Response{data=[]model.FlowerType}
// @Failure 500 {object} model.Response
// @Router /api/v1/flower-types [get]
func (c *Controller) GetAllFlowerTypes(ctx *gin.Context) {
	flowerTypes, err := c.service.GetAllFlowerTypes()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch flower types", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Flower types fetched successfully", flowerTypes))
}

// SearchProducts godoc
// @Summary Search products with advanced filters
// @Description Search and filter products by multiple criteria with pagination and sorting
// @Tags products
// @Accept json
// @Produce json
// @Param query query string false "Search query for product name or description"
// @Param flower_type query string false "Filter by flower type"
// @Param occasion query string false "Filter by occasion"
// @Param price_min query number false "Minimum price filter"
// @Param price_max query number false "Maximum price filter"
// @Param condition query string false "Filter by product condition" Enums(NewFlower, OldFlower, LowStock)
// @Param sort_by query string false "Sort by option" Enums(price_asc, price_desc, name_asc, name_desc, newest, best_selling)
// @Param page query int false "Page number (default: 1)" minimum(1)
// @Param limit query int false "Items per page (default: 20, max: 100)" minimum(1) maximum(100)
// @Success 200 {object} model.Response{data=model.ProductSearchResponse}
// @Failure 400 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/products/search [get]
func (c *Controller) SearchProducts(ctx *gin.Context) {
	var query dto.ProductSearchQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid query parameters", nil))
		return
	}

	result, err := c.service.SearchProducts(&query)
	if err != nil {
		log.Error().Err(err).Msg("Failed to search products")
		
		// Handle specific validation errors
		if err.Error() == "minimum price cannot be greater than maximum price" ||
		   err.Error() == "invalid product condition" ||
		   err.Error() == "invalid sort option" {
			ctx.JSON(http.StatusBadRequest, model.NewResponse(err.Error(), nil))
			return
		}
		
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to search products", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Products searched successfully", result))
}

// GetProductDetails godoc
// @Summary Get detailed product information
// @Description Get comprehensive product details including images, occasions, ratings, and sales data
// @Tags products
// @Accept json
// @Produce json
// @Param id path int true "Product ID"
// @Success 200 {object} model.Response{data=model.Product}
// @Failure 400 {object} model.Response
// @Failure 404 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/products/{id} [get]
func (c *Controller) GetProductDetails(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, model.NewResponse("Invalid ID format", nil))
		return
	}

	product, err := c.service.GetProductDetails(uint(id))
	if err != nil {
		if err.Error() == "not found" {
			ctx.JSON(http.StatusNotFound, model.NewResponse("Product not found", nil))
			return
		}
		log.Error().Err(err).Msg("Failed to fetch product details")
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch product details", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Product details fetched successfully", product))
}

// GetProductFilters godoc
// @Summary Get available filter options
// @Description Get all available filter options for product search including flower types, occasions, and price range
// @Tags products
// @Accept json
// @Produce json
// @Success 200 {object} model.Response{data=model.FilterOptions}
// @Failure 500 {object} model.Response
// @Router /api/v1/products/filters [get]
func (c *Controller) GetProductFilters(ctx *gin.Context) {
	filters, err := c.service.GetSearchFilters()
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch product filters")
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch filter options", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Filter options fetched successfully", filters))
}

// GetAllOccasions godoc
// @Summary Get all occasions
// @Description Get all available occasions for flower products
// @Tags occasions
// @Accept json
// @Produce json
// @Success 200 {object} model.Response{data=[]model.Occasion}
// @Failure 500 {object} model.Response
// @Router /api/v1/occasions [get]
func (c *Controller) GetAllOccasions(ctx *gin.Context) {
	occasions, err := c.service.GetAllOccasions()
	if err != nil {
		log.Error().Err(err).Msg("Failed to fetch occasions")
		ctx.JSON(http.StatusInternalServerError, model.NewResponse("Failed to fetch occasions", nil))
		return
	}

	ctx.JSON(http.StatusOK, model.NewResponse("Occasions fetched successfully", occasions))
}
