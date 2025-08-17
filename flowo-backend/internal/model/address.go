package model

type Address struct {
	AddressID         int    `db:"address_id" json:"address_id"`
	FirebaseUID       string `db:"firebase_uid" json:"firebase_uid"`
	RecipientName     string `db:"recipient_name" json:"recipient_name"`
	PhoneNumber       string `db:"phone_number" json:"phone_number"`
	StreetAddress     string `db:"street_address" json:"street_address"`
	City              string `db:"city" json:"city"`
	PostalCode        string `db:"postal_code" json:"postal_code"`
	Country           string `db:"country" json:"country"`
	IsDefaultShipping bool   `db:"is_default_shipping" json:"is_default_shipping"`
}
