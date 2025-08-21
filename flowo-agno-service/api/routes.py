"""
API Routes
Defines all API endpoints for the Agno service
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import asyncio
import json
from core import agent_manager
from config import settings
from tools.flower_tools import FlowerTools, ProductSearchParams, RecommendationParams

router = APIRouter()

# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default"
    stream: Optional[bool] = True

class ChatResponse(BaseModel):
    response: str
    user_id: str
    success: bool
    provider: Optional[str] = None
    model: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    provider: str
    model: str
    debug_mode: bool

# Health Check
@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="flowo-agno",
        provider=settings.agent_provider,
        model=settings.agent_model,
        debug_mode=settings.debug_mode
    )

# Chat Endpoints
@router.post("/api/chat")
async def chat(request: ChatRequest):
    """
    Chat with the Flowo AI Assistant
    """
    try:
        if request.stream:
            async def generate():
                # Run the agent in a thread pool to avoid blocking
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    agent_manager.get_response_dict,
                    request.message,
                    request.user_id
                )
                yield json.dumps(response) + "\n"
            
            return StreamingResponse(
                generate(),
                media_type="application/x-ndjson"
            )
        else:
            response = agent_manager.get_response_dict(
                request.message,
                request.user_id
            )
            return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Search Endpoints
@router.post("/api/search")
async def search_products(
    query: Optional[str] = None,
    flower_type: Optional[str] = None,
    occasion: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    limit: int = 10
):
    """Direct product search endpoint"""
    try:
        tools = FlowerTools(api_url=settings.backend_url)
        params = ProductSearchParams(
            query=query,
            flower_type=flower_type,
            occasion=occasion,
            price_min=price_min,
            price_max=price_max,
            limit=limit
        )
        
        result = tools.search_products(params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Recommendation Endpoints
@router.post("/api/recommendations")
async def get_recommendations(
    recommendation_type: str = "trending",
    user_id: Optional[str] = None,
    occasion: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    limit: int = 10
):
    """Get flower recommendations"""
    try:
        tools = FlowerTools(api_url=settings.backend_url)
        params = RecommendationParams(
            recommendation_type=recommendation_type,
            firebase_uid=user_id,
            occasion=occasion,
            price_min=price_min,
            price_max=price_max,
            limit=limit
        )
        
        result = tools.get_recommendations(params)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Metadata Endpoints
@router.get("/api/occasions")
async def get_occasions():
    """Get available occasions"""
    try:
        tools = FlowerTools(api_url=settings.backend_url)
        return tools.get_occasions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/flower-types")
async def get_flower_types():
    """Get available flower types"""
    try:
        tools = FlowerTools(api_url=settings.backend_url)
        return tools.get_flower_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Admin Endpoints
@router.post("/api/admin/reload")
async def reload_agent():
    """Reload agent with updated configuration"""
    try:
        agent_manager.reload_agent()
        return {"message": "Agent reloaded successfully", "provider": settings.agent_provider, "model": settings.agent_model}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))