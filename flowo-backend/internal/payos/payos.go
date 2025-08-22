package payos

import (
	payos "github.com/payOSHQ/payos-lib-golang"

	"flowo-backend/config"
)

func InitPayOS(cfg *config.Config) {
	payos.Key(cfg.PayOS.ClientID, cfg.PayOS.APIKey, cfg.PayOS.ChecksumKey)
}