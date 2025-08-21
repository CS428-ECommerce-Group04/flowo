package service

import (
	"flowo-backend/internal/dto"
	"flowo-backend/internal/model"
	"flowo-backend/internal/repository"
)

type AddressService interface {
	CreateAddress(uid string, req dto.CreateAddressRequest) (*dto.AddressResponse, error)
	GetAddresses(uid string) ([]dto.AddressResponse, error)
	DeleteAddress(uid string, addressID int) error
	SetDefaultAddress(uid string, addressID int) error
	GetDefaultAddress(uid string) (*dto.AddressResponse, error)
}

type addressService struct {
	repo repository.AddressRepository
}

func NewAddressService(repo repository.AddressRepository) AddressService {
	return &addressService{repo: repo}
}

func (s *addressService) CreateAddress(uid string, req dto.CreateAddressRequest) (*dto.AddressResponse, error) {
	if req.IsDefault {
		if err := s.repo.ClearDefault(uid); err != nil {
			return nil, err
		}
	}

	addr := model.Address{
		FirebaseUID:       uid,
		RecipientName:     req.RecipientName,
		PhoneNumber:       req.PhoneNumber,
		StreetAddress:     req.StreetAddress,
		City:              req.City,
		PostalCode:        req.PostalCode,
		Country:           req.Country,
		IsDefaultShipping: req.IsDefault,
	}
	id, err := s.repo.Create(&addr)
	if err != nil {
		return nil, err
	}
	addr.AddressID = id

	return &dto.AddressResponse{
		AddressID:     addr.AddressID,
		RecipientName: addr.RecipientName,
		PhoneNumber:   addr.PhoneNumber,
		StreetAddress: addr.StreetAddress,
		City:          addr.City,
		PostalCode:    addr.PostalCode,
		Country:       addr.Country,
		IsDefault:     addr.IsDefaultShipping,
	}, nil
}

func (s *addressService) GetAddresses(uid string) ([]dto.AddressResponse, error) {
	addresses, err := s.repo.GetAllByUser(uid)
	if err != nil {
		return nil, err
	}
	res := []dto.AddressResponse{}
	for _, addr := range addresses {
		res = append(res, dto.AddressResponse{
			AddressID:     addr.AddressID,
			RecipientName: addr.RecipientName,
			PhoneNumber:   addr.PhoneNumber,
			StreetAddress: addr.StreetAddress,
			City:          addr.City,
			PostalCode:    addr.PostalCode,
			Country:       addr.Country,
			IsDefault:     addr.IsDefaultShipping,
		})
	}
	return res, nil
}

func (s *addressService) DeleteAddress(uid string, addressID int) error {
	return s.repo.Delete(uid, addressID)
}

func (s *addressService) SetDefaultAddress(uid string, addressID int) error {
	if err := s.repo.ClearDefault(uid); err != nil {
		return err
	}
	return s.repo.SetDefault(uid, addressID)
}

func (s *addressService) GetDefaultAddress(uid string) (*dto.AddressResponse, error) {
	addr, err := s.repo.GetDefault(uid)
	if err != nil {
		return nil, err
	}
	if addr == nil {
		return nil, nil
	}

	return &dto.AddressResponse{
		AddressID:     addr.AddressID,
		RecipientName: addr.RecipientName,
		PhoneNumber:   addr.PhoneNumber,
		StreetAddress: addr.StreetAddress,
		City:          addr.City,
		PostalCode:    addr.PostalCode,
		Country:       addr.Country,
		IsDefault:     addr.IsDefaultShipping,
	}, nil
}
