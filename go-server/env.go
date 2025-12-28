package main

import (
	"log"
	"strings"

	// ... existing imports ...
	"github.com/spf13/viper" // NEW IMPORT
)

// Define the global variables
type Config struct {
	Cors []string `mapstructure:"cors"`
	Port string   `mapstructure:"port"`
}

var AppConfig Config

// init function runs before main()
func init() {
	// 1. Viper Setup
	viper.SetConfigName("config") // Name of the config file (e.g., config.yaml)
	viper.SetConfigType("yaml")   // Type of the config file
	viper.AddConfigPath(".")      // Search the current directory for the config

	// 2. Read Config File
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Fatal error reading config file: %s \n", err)
	}

	// 3. Unmarshal Config into struct
	if err := viper.Unmarshal(&AppConfig); err != nil {
		log.Fatalf("Unable to unmarshal config: %v \n", err)
	}

	log.Printf("Loaded trusted WebSocket origins: %v", strings.Join(AppConfig.Cors, ", "))
}
