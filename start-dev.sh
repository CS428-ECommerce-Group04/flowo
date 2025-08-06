#!/bin/bash

echo "Starting Flowo Development Environment..."
echo "This will start both frontend and backend with hot reload capabilities."
echo ""

# Stop any existing containers
docker-compose -f docker-compose.dev.yml down

# Build and start services
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "Development environment stopped."