# Flowo Agno AI Service

AI-powered flower recommendation and search service built with Agno framework.

## Features

- **Intelligent Product Search**: Natural language search for flower products
- **Personalized Recommendations**: AI-driven recommendations based on user preferences
- **Memory & Personalization**: Remembers user preferences for future interactions
- **Reasoning Capabilities**: Advanced reasoning for better responses
- **AG-UI Components**: Ready-to-use UI components for CopilotKit integration

## Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude
- `OPENAI_API_KEY`: Your OpenAI API key for embeddings
- `BACKEND_API_URL`: Backend API URL (default: http://backend:8081/api/v1)

### Local Development

1. Create virtual environment and install dependencies:
```bash
uv venv --python 3.12
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

2. Run the service:
```bash
python main.py
```

The service will be available at http://localhost:8082

### Docker Development

Start with docker-compose:
```bash
docker-compose -f docker-compose.dev.yml up agno-dev
```

## API Endpoints

### Chat Endpoint
`POST /api/chat`
```json
{
  "message": "Show me red roses under $50",
  "user_id": "user123",
  "stream": true
}
```

### Direct Search
`POST /api/search`
```json
{
  "query": "roses",
  "flower_type": "roses",
  "occasion": "birthday",
  "price_min": 20,
  "price_max": 50,
  "limit": 10
}
```

### Recommendations
`POST /api/recommendations`
```json
{
  "recommendation_type": "trending",
  "user_id": "user123",
  "occasion": "wedding",
  "limit": 10
}
```

## Example Queries

- "Show me red roses under $50"
- "What flowers do you recommend for a wedding?"
- "I need birthday flowers for my mom who loves tulips"
- "Show me trending flowers"
- "What are good anniversary bouquets?"
- "Find purple flowers for spring"

## AG-UI Components

The service includes pre-built UI components for CopilotKit integration:

- **FlowerCard**: Display individual flower products
- **FlowerGrid**: Grid layout for multiple products
- **RecommendationCarousel**: Carousel for recommendations
- **SearchFilters**: Interactive search filters
- **ChatMessage**: Chat interface messages
- **QuickActions**: Quick action buttons

## Architecture

- **Agent**: Claude-powered AI agent with reasoning and memory
- **Tools**: Custom tools for product search and recommendations
- **Storage**: SQLite for conversation history
- **Memory**: User preference storage and recall
- **API**: FastAPI service with streaming support

## Testing

Test the agent directly:
```bash
python agent.py
```

Test API endpoints:
```bash
curl -X POST http://localhost:8082/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me roses", "user_id": "test"}'
```