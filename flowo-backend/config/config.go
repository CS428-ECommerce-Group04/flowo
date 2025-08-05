package config

import (
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type Config struct {
	Server       ServerConfig
	Database     DatabaseConfig
	Firebase     FirebaseConfig
	VNPay        VNPayConfig
	Domain       string
	IsProduction bool
}

type ServerConfig struct {
	Port string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

type FirebaseConfig struct {
	CredentialsPath string
	APIKey          string
}

type VNPayConfig struct {
	TmnCode    string
	HashSecret string
	URL        string
	ReturnURL  string
}

func NewConfig() (*Config, error) {
	// Configure Viper to read .env file
	viper.SetConfigName(".env")
	viper.SetConfigType("env")
	viper.AddConfigPath(".")

	// Enable automatic environment variable loading
	viper.AutomaticEnv()

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		log.Warn().Err(err).Msg("Error reading config file")
	}

	var config Config
	config.Server.Port = viper.GetString("SERVER_PORT")
	config.Database.Host = viper.GetString("DATABASE_HOST")
	config.Database.Port = viper.GetString("DATABASE_PORT")
	config.Database.User = viper.GetString("DATABASE_USER")
	config.Database.Password = viper.GetString("DATABASE_PASSWORD")
	config.Database.Name = viper.GetString("DATABASE_NAME")
	config.Firebase.CredentialsPath = viper.GetString("FIREBASE_CREDENTIALS_PATH")
	config.Firebase.APIKey = viper.GetString("FIREBASE_API_KEY")
	config.VNPay.TmnCode = viper.GetString("VNPAY_TMN_CODE")
	config.VNPay.HashSecret = viper.GetString("VNPAY_HASH_SECRET")
	config.VNPay.URL = viper.GetString("VNPAY_URL")
	config.VNPay.ReturnURL = viper.GetString("VNPAY_RETURN_URL")
	config.Domain = viper.GetString("DOMAIN")
	config.IsProduction = viper.GetBool("IS_PRODUCTION")

	// Set default Firebase credentials path if not specified
	if config.Firebase.CredentialsPath == "" {
		config.Firebase.CredentialsPath = "private_key.json"
	}

	// Set default VNPay configuration for development
	if config.VNPay.TmnCode == "" {
		config.VNPay.TmnCode = "DEMO"
	}
	if config.VNPay.HashSecret == "" {
		config.VNPay.HashSecret = "DEMOHASHSECRET"
	}
	if config.VNPay.URL == "" {
		config.VNPay.URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
	}
	if config.VNPay.ReturnURL == "" {
		config.VNPay.ReturnURL = "http://localhost:5173/payment/result"
	}

	log.Info().Interface("config", config).Msg("Config loaded")
	return &config, nil
}
