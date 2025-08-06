# Flowo Docker Setup

This repository includes Docker configurations to run both the frontend and backend services together.

## Quick Start

### Production Environment
```bash
# Run the complete production stack
./start-prod.sh

# Or manually:
docker-compose up --build
```

### Development Environment
```bash
# Run with hot reload and development features
./start-dev.sh

# Or manually:
docker-compose -f docker-compose.dev.yml up --build
```

## Services

### Production (`docker-compose.yml`)
- **Frontend**: Nginx serving built React app on port 80
- **Backend**: Go API server on port 8081
- **MySQL**: Database on port 3306
- **Redis**: Cache server on port 6379

### Development (`docker-compose.dev.yml`)
- **Frontend**: Vite dev server with HMR on port 5173
- **Backend**: Go API server on port 8081 (with volume mounting for development)
- **MySQL**: Database on port 3306
- **Redis**: Cache server on port 6379

## URLs

### Production
- Frontend: http://localhost
- Backend API: http://localhost:8081/api/v1
- Database: localhost:3306

### Development
- Frontend: http://localhost:5173
- Backend API: http://localhost:8081/api/v1
- Database: localhost:3306
- Node Inspector: http://localhost:9229 (for debugging)

## Environment Variables

The following environment variables are automatically configured:

### Backend
- `SERVER_PORT=8081`
- `DATABASE_HOST=mysql`
- `DATABASE_PORT=3306`
- `DATABASE_USER=root`
- `DATABASE_PASSWORD=password`
- `DATABASE_NAME=flowo_db`
- `REDIS_ADDR=redis:6379`

### Frontend (Development)
- `VITE_API_BASE_URL=http://localhost:8081/api/v1`
- `NODE_ENV=development`
- Hot reload and debugging features enabled

## Commands

```bash
# Stop all services
docker-compose down

# Stop development services
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose logs -f

# Rebuild specific service
docker-compose build frontend
docker-compose build backend

# Run without building
docker-compose up

# Clean up (remove containers, networks, volumes)
docker-compose down -v --remove-orphans
```

## Troubleshooting

1. **Port conflicts**: Make sure ports 80, 5173, 8081, 3306, 6379 are not in use
2. **Database connection issues**: Wait for MySQL healthcheck to pass (15-30 seconds)
3. **Frontend API calls**: Check that `VITE_API_BASE_URL` points to the correct backend
4. **Permission issues**: Ensure Docker daemon is running and you have proper permissions

## File Structure

```
/
├── docker-compose.yml          # Production configuration
├── docker-compose.dev.yml      # Development configuration
├── start-prod.sh              # Production startup script
├── start-dev.sh               # Development startup script
├── flowo-frontend/
│   ├── Dockerfile             # Frontend production build
│   └── nginx.conf             # Nginx configuration
└── flowo-backend/
    ├── Dockerfile             # Backend build (existing)
    └── docker-compose.yml     # Backend-only config (existing)
```