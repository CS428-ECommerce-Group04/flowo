"""
Flowo Agno Service
AI-powered flower recommendation and search service
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from api import router

# Create FastAPI app
app = FastAPI(
    title="Flowo AI Agent Service",
    description="AI-powered flower recommendation and search service",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
if settings.get("api.cors.enabled", True):
    origins = settings.get("api.cors.origins", ["*"])
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routes
app.include_router(router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Flowo Agno Service",
        "version": "2.0.0",
        "provider": settings.agent_provider,
        "model": settings.agent_model,
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    # Print startup information
    print("=" * 60)
    print(f"🌸 Flowo Agno Service Starting...")
    print(f"📦 Provider: {settings.agent_provider}")
    print(f"🤖 Model: {settings.agent_model}")
    print(f"🔧 Debug Mode: {settings.debug_mode}")
    print(f"🌐 API URL: http://{settings.api_host}:{settings.api_port}")
    print(f"📚 Docs: http://{settings.api_host}:{settings.api_port}/docs")
    print("=" * 60)
    
    # Run server
    uvicorn.run(
        "main:app",  # Use import string for reload to work
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug_mode
    )