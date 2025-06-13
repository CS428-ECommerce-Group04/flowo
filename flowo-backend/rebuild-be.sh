#!/bin/bash

# Stop containers
docker-compose down

# Restart app with build
docker-compose up --build --force-recreate