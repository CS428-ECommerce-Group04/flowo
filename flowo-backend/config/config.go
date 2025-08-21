package config

import (
	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type Config struct {
	Server       ServerConfig
	Database     DatabaseConfig
	Firebase     FirebaseConfig
	Domain       string
	IsProduction bool
	PayOS        PayOSConfig
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

type PayOSConfig struct {
	ClientID    string
	APIKey      string
	ChecksumKey string
	Domain      string
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
	config.Domain = viper.GetString("DOMAIN")
	config.IsProduction = viper.GetBool("IS_PRODUCTION")

	// PayOS
	config.PayOS.ClientID = viper.GetString("PAYOS_CLIENT_ID")
	config.PayOS.APIKey = viper.GetString("PAYOS_API_KEY")
	config.PayOS.ChecksumKey = viper.GetString("PAYOS_CHECKSUM_KEY")
	config.PayOS.Domain = viper.GetString("PAYOS_DOMAIN")

	// Set default Firebase credentials path if not specified
	if config.Firebase.CredentialsPath == "" {
		config.Firebase.CredentialsPath = "private_key.json"
	}

	log.Info().Interface("config", config).Msg("Config loaded")
	return &config, nil
}
