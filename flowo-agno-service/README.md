# Flowo Agno AI Service

AI-powered flower recommendation and search service built with Agno framework.

## 🏗️ Architecture

The service follows a modular, extensible architecture:

```
flowo-agno-service/
├── config/           # Configuration management
│   └── settings.py   # Settings loader with env overrides
├── core/             # Core agent functionality
│   ├── agent.py      # Agent manager
│   └── providers.py  # Model providers (OpenAI, Anthropic, etc.)
├── api/              # API layer
│   └── routes.py     # FastAPI routes
├── memory/           # Memory management
│   └── manager.py    # User preference storage
├── storage/          # Conversation storage
│   └── manager.py    # Session history
├── tools/            # Custom tools
│   ├── base.py       # Base tool class
│   └── flower_tools.py # Flower search & recommendations
├── settings.yaml     # Main configuration file
└── main.py          # Application entry point
```

## 🚀 Features

- **Intelligent Product Search**: Natural language search for flower products
- **Personalized Recommendations**: AI-driven recommendations based on user preferences
- **Memory & Personalization**: Remembers user preferences for future interactions
- **Reasoning Capabilities**: Advanced reasoning for better responses
- **AG-UI Components**: Ready-to-use UI components for CopilotKit integration

## 🤖 Supported AI Providers

The service supports multiple AI providers (default: OpenAI):

- **OpenAI** (Default): GPT-4o-mini, GPT-4o
- **Anthropic**: Claude 3 Haiku, Claude 3.5 Sonnet
- **Google**: Gemini 1.5 Flash, Gemini 1.5 Pro
- **Groq**: Fast inference with various models

Configure via environment variables:
```bash
AGENT_PROVIDER=openai    # or anthropic, google, groq
AGENT_MODEL=gpt-4o-mini  # or specific model ID
```

## Setup

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables (at least one):
- `OPENAI_API_KEY`: OpenAI API key (required for default config)
- `ANTHROPIC_API_KEY`: Anthropic API key (for Claude models)
- `GOOGLE_API_KEY`: Google API key (for Gemini models)
- `GROQ_API_KEY`: Groq API key (for Groq models)

Other settings:
- `BACKEND_API_URL`: Backend API URL (default: http://backend:8081/api/v1)
- `AGENT_PROVIDER`: AI provider (default: openai)
- `AGENT_MODEL`: Model ID or alias (default: gpt-4o-mini)

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