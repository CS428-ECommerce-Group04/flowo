#!/bin/bash

# Stop containers and remove volumes
docker-compose down -v

# Restart app with build
docker-compose up --build --force-recreate