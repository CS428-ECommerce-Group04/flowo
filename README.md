## Prerequisites

- Docker & Docker Compose
- Node.js (v18 or higher)
- Go 1.21 or higher
- Yarn package manager

## Getting Started

### Backend Setup

1. Navigate to the backend directory:

```bash
cd flowo-backend
```

2. Create a `.env` file in the backend directory:

```env
SERVER_PORT=8081
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=password
DATABASE_NAME=flowo_db
```

3. Start the application using Docker Compose:

```bash
./rebuild-all.sh
```

The API will be available at `http://localhost:8081`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd flowo-frontend
```

2. Create a `.env` file in the frontend directory:

```
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

3. Install dependencies:

```bash
yarn install
```

4. Start the development server:

```bash
yarn dev
```

The application will be available at `http://localhost:5173`

## API Documentation

After starting the Docker containers, you can access the Swagger UI to test and explore the API:

- URL: `http://localhost:8081/swagger/index.html`