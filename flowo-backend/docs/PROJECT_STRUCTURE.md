# Flowo Backend Project Structure

## Overview
This document outlines the structure and architecture of the Flowo Online Flower Shop backend application, built using Go with clean architecture principles.

## Project Structure

```
flowo-backend/
├── cmd/                          # Application entry points
│   └── main.go                   # Main application entry point with DI setup
├── config/                       # Configuration management
│   └── config.go                 # App configuration (database, server settings)
├── database/                     # Database connection and setup
│   └── db.go                     # Database connection initialization
├── docs/                         # Documentation files
│   ├── PRD.md                    # Product Requirements Document
│   ├── PROJECT_STRUCTURE.md      # This file - project architecture
│   ├── docs.go                   # Swagger generated documentation
│   ├── swagger.json              # Swagger specification (JSON)
│   └── swagger.yaml              # Swagger specification (YAML)
├── init_script/                  # Database initialization scripts
│   ├── init.sql                  # Database schema creation
│   └── init2.sql                 # Sample data insertion
├── internal/                     # Private application code
│   ├── controller/               # HTTP handlers (presentation layer)
│   │   └── controller.go         # API endpoints and request handling
│   ├── dto/                      # Data Transfer Objects
│   │   ├── product.go            # Product-related DTOs
│   │   └── todo.go               # Todo-related DTOs
│   ├── logger/                   # Logging utilities
│   ├── model/                    # Domain models (business entities)
│   │   ├── product.go            # Product and FlowerType models
│   │   ├── response.go           # Standard API response model
│   │   └── todo.go               # Todo model
│   ├── repository/               # Data access layer (persistence)
│   │   └── repository.go         # Database operations and queries
│   └── service/                  # Business logic layer
│       └── service.go            # Business rules and processing
├── docker-compose.yml            # Docker services configuration
├── Dockerfile                    # Container definition
├── go.mod                        # Go module dependencies
├── go.sum                        # Go module checksums
├── rebuild-all.sh                # Build script for all components
├── rebuild-be.sh                 # Backend-only build script
├── .gitignore                    # Git ignore rules
└── README.md                     # Project documentation
```

## Architecture Patterns

### Clean Architecture
The project follows clean architecture principles with clear separation of concerns:

1. **Presentation Layer** (`internal/controller/`)
   - HTTP request/response handling
   - Input validation and serialization
   - API documentation with Swagger

2. **Business Logic Layer** (`internal/service/`)
   - Core business rules and validation
   - Orchestration of repository operations
   - Domain-specific processing

3. **Data Access Layer** (`internal/repository/`)
   - Database operations and queries
   - Data persistence abstraction
   - SQL query management

4. **Domain Models** (`internal/model/`)
   - Core business entities
   - Data structures representing business concepts

5. **Data Transfer Objects** (`internal/dto/`)
   - Request/response data structures
   - API contract definitions

### Dependency Injection
Uses Uber FX for dependency injection, providing:
- Clean separation of concerns
- Easy testing and mocking
- Lifecycle management
- Configuration management

## Database Schema Design

The application uses MySQL with the following key entities:

### Core Entities
- **User**: Customer and admin accounts
- **FlowerProduct**: Product catalog with pricing and inventory
- **FlowerType**: Flower categories (Rose, Lily, Orchid)
- **Occasion**: Special occasions (Birthday, Valentine's Day)
- **ProductImage**: Product image management
- **Address**: Customer shipping/billing addresses

### E-commerce Features
- **Cart/CartItem**: Shopping cart management
- **Order/OrderItem**: Order processing and tracking
- **Payment**: Payment transaction records
- **Review**: Product reviews and ratings

### Business Logic
- **PricingRule**: Dynamic pricing engine
- **SpecialDay**: Promotional periods
- **LoyaltyProgram**: Customer loyalty system
- **UserProductInteraction**: Analytics and recommendations

## Technology Stack

### Backend Framework
- **Go 1.21+**: Modern, performant backend language
- **Gin**: Fast HTTP web framework
- **GORM**: ORM for database operations (current: raw SQL)
- **MySQL**: Relational database

### Development Tools
- **Swagger/OpenAPI**: API documentation
- **Zerolog**: Structured logging
- **Viper**: Configuration management
- **Docker**: Containerization

### External Integrations
- **CORS**: Cross-origin request handling
- **fx**: Dependency injection framework

## API Design

### Current Endpoints
```
GET  /health                      # Health check
GET  /swagger/*any               # API documentation

# Todo Management (legacy)
GET  /api/v1/todos               # List all todos
GET  /api/v1/todos/:id           # Get todo by ID
POST /api/v1/todos               # Create new todo
PUT  /api/v1/todos/:id           # Update todo
DELETE /api/v1/todos/:id         # Delete todo

# Product Management
GET  /api/v1/products            # List all products (basic)
GET  /api/v1/product/:id         # Get product details
GET  /api/v1/product/flower-type/:type  # Filter by flower type
POST /api/v1/product             # Create product (admin)
PUT  /api/v1/product/:id         # Update product (admin)
DELETE /api/v1/product/:id       # Delete product (admin)

# Catalog
GET  /api/v1/flower-types        # List flower type categories
```

### Planned Enhancements (Based on PRD Requirements)
```
# Advanced Product Search & Filtering
GET  /api/v1/products/search     # Advanced search with filters
  - Query parameters: type, occasion, price_min, price_max, condition
  - Sorting: price_asc, price_desc, name_asc, newest, best_selling
  - Pagination: page, limit

# Product Details Enhancement
GET  /api/v1/products/:id/details # Enhanced product details with images
```

## Development Workflow

### Running the Application
```bash
# Start all services
docker-compose up

# Rebuild backend only
./rebuild-be.sh

# Rebuild all components
./rebuild-all.sh
```

### Database Setup
1. MySQL container starts via docker-compose
2. Schema created by `init_script/init.sql`
3. Sample data loaded from `init_script/init2.sql`

### API Documentation
- Swagger UI available at: `http://localhost:8081/swagger/index.html`
- Auto-generated from code annotations
- Regenerate with: `swag init -g cmd/main.go`

## Code Standards

### Error Handling
- Consistent error response format via `model.Response`
- Proper HTTP status codes
- Structured logging with zerolog

### API Response Format
```json
{
  "message": "Operation result message",
  "data": {} // Response payload or null
}
```

### Database Conventions
- Table names: PascalCase (FlowerProduct)
- Column names: snake_case (flower_type_id)
- Primary keys: {table}_id format
- Foreign keys: explicit references

## Security Considerations

### Current State
- CORS configuration for cross-origin requests
- Basic input validation

### TODO/Planned
- JWT authentication for protected endpoints
- Role-based access control (Customer/Admin)
- Rate limiting
- Input sanitization
- HTTPS enforcement

## Performance Optimization

### Current
- Connection pooling via database/sql
- Minimal query optimization
- Basic error handling

### Planned
- Query optimization and indexing
- Caching layer (Redis)
- Database connection pooling tuning
- Response compression
- Image optimization and CDN

## Testing Strategy

### Current State
- Basic structure in place for unit testing
- No integration tests yet

### Planned
- Unit tests for service layer
- Integration tests for repository layer
- API endpoint testing
- Mock implementations for testing

## Deployment

### Current
- Docker containerization
- docker-compose for local development
- MySQL database container

### Production Considerations
- Kubernetes deployment manifests
- Environment-specific configuration
- Database migration strategy
- Monitoring and logging
- Backup and recovery procedures

---

*This document is maintained alongside code changes and should be updated when significant architectural changes are made.* 