package controller

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/middleware"
	"flowo-backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AddressController struct {
	addressService service.AddressService
	userService    service.UserService
}

func NewAddressController(as service.AddressService, us service.UserService) *AddressController {
	return &AddressController{addressService: as, userService: us}
}

func (ctrl *AddressController) RegisterRoutes(rg *gin.RouterGroup) {
	addr := rg.Group("/addresses")
	addr.POST("", ctrl.CreateAddress)
	addr.GET("", ctrl.GetAddresses)
	addr.DELETE("/:id", ctrl.DeleteAddress)
	addr.PUT("/:id/default", ctrl.SetDefaultAddress)
}

// CreateAddress godoc
// @Summary Add a new address
// @Description Add a new shipping address for the authenticated user
// @Tags addresses
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param request body dto.CreateAddressRequest true "Address details"
// @Success 201 {object} dto.AddressResponse
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/addresses [post]
func (ctrl *AddressController) CreateAddress(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	var req dto.CreateAddressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	address, err := ctrl.addressService.CreateAddress(user.FirebaseUID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create address"})
		return
	}

	c.JSON(http.StatusCreated, address)
}

// GetAddresses godoc
// @Summary Get all addresses of user
// @Description Retrieve all saved addresses for the authenticated user
// @Tags addresses
// @Produce json
// @Security BearerAuth
// @Success 200 {array} dto.AddressResponse
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/addresses [get]
func (ctrl *AddressController) GetAddresses(c *gin.Context) {
	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	addresses, err := ctrl.addressService.GetAddresses(user.FirebaseUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot fetch addresses"})
		return
	}

	c.JSON(http.StatusOK, addresses)
}

// DeleteAddress godoc
// @Summary Delete an address
// @Description Delete a specific address by ID (must belong to the authenticated user)
// @Tags addresses
// @Produce json
// @Security BearerAuth
// @Param id path int true "Address ID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/addresses/{id} [delete]
func (ctrl *AddressController) DeleteAddress(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	if err := ctrl.addressService.DeleteAddress(user.FirebaseUID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete address"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "address deleted"})
}

// SetDefaultAddress godoc
// @Summary Set default address
// @Description Mark an address as default shipping address for the authenticated user
// @Tags addresses
// @Produce json
// @Security BearerAuth
// @Param id path int true "Address ID"
// @Success 200 {object} model.Response
// @Failure 400 {object} model.Response
// @Failure 401 {object} model.Response
// @Failure 500 {object} model.Response
// @Router /api/v1/addresses/{id}/default [put]
func (ctrl *AddressController) SetDefaultAddress(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid address id"})
		return
	}

	firebaseUID, exists := middleware.GetFirebaseUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user, err := ctrl.userService.GetUserByFirebaseUID(firebaseUID)
	if err != nil || user == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
		return
	}

	if err := ctrl.addressService.SetDefaultAddress(user.FirebaseUID, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set default"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "default address updated"})
}
