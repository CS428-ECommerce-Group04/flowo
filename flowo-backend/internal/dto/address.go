package dto

type CreateAddressRequest struct {
	RecipientName string `json:"recipient_name" binding:"required"`
	PhoneNumber   string `json:"phone_number" binding:"required"`
	StreetAddress string `json:"street_address" binding:"required"`
	City          string `json:"city" binding:"required"`
	PostalCode    string `json:"postal_code"`
	Country       string `json:"country" binding:"required"`
	IsDefault     bool   `json:"is_default_shipping"` // if True server set to default
}

type AddressResponse struct {
	AddressID     int    `json:"address_id"`
	RecipientName string `json:"recipient_name"`
	PhoneNumber   string `json:"phone_number"`
	StreetAddress string `json:"street_address"`
	City          string `json:"city"`
	PostalCode    string `json:"postal_code"`
	Country       string `json:"country"`
	IsDefault     bool   `json:"is_default_shipping"`
}
