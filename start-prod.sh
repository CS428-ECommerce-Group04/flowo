#!/bin/bash

echo "Starting Flowo Production Environment..."
echo "This will build and start the complete application stack."
echo ""

# Stop any existing containers
docker-compose down

# Build and start services
docker-compose up --build

echo ""
echo "Production environment stopped."