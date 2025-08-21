import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, AsyncGenerator
import asyncio
import json
from agent import flowo_agent
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Flowo AI Agent Service",
    description="AI-powered flower recommendation and search service",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "default"
    stream: Optional[bool] = True

class ChatResponse(BaseModel):
    response: str
    user_id: str
    success: bool

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "flowo-agent"}

@app.post("/api/chat")
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
                    flowo_agent.get_response_dict,
                    request.message,
                    request.user_id
                )
                yield json.dumps(response)
            
            return StreamingResponse(
                generate(),
                media_type="application/x-ndjson"
            )
        else:
            response = flowo_agent.get_response_dict(
                request.message,
                request.user_id
            )
            return ChatResponse(**response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/search")
async def search_products(
    query: Optional[str] = None,
    flower_type: Optional[str] = None,
    occasion: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    limit: int = 10
):
    """
    Direct product search endpoint
    """
    try:
        from tools.flower_tools import FlowerTools, ProductSearchParams
        
        tools = FlowerTools()
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

@app.post("/api/recommendations")
async def get_recommendations(
    recommendation_type: str = "trending",
    user_id: Optional[str] = None,
    occasion: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    limit: int = 10
):
    """
    Get flower recommendations
    """
    try:
        from tools.flower_tools import FlowerTools, RecommendationParams
        
        tools = FlowerTools()
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

@app.get("/api/occasions")
async def get_occasions():
    """Get available occasions"""
    try:
        from tools.flower_tools import FlowerTools
        tools = FlowerTools()
        return tools.get_occasions()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/flower-types")
async def get_flower_types():
    """Get available flower types"""
    try:
        from tools.flower_tools import FlowerTools
        tools = FlowerTools()
        return tools.get_flower_types()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("SERVICE_PORT", "8082"))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=True)