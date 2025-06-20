FROM golang:alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache gcc musl-dev

# Copy go mod and sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Install swag for swagger generation
RUN go install github.com/swaggo/swag/cmd/swag@latest

# Copy the source code
COPY . .

# Generate swagger documentation
RUN swag init -g cmd/main.go

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main cmd/main.go

# Use a smaller image for the final container
FROM alpine:latest

WORKDIR /app

# Copy the binary from the builder stage
COPY --from=0 /app/main .
COPY --from=0 /app/.env .

# Expose the application port
EXPOSE 8081

# Run the application
CMD ["./main"] 