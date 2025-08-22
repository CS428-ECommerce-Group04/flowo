"""
AG-UI Components for Flowo Assistant
These components integrate with CopilotKit for generative UI
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel

class FlowerCard(BaseModel):
    """Component for displaying a flower product"""
    id: int
    name: str
    description: str
    price: float
    image_url: Optional[str]
    flower_type: str
    occasion: List[str]
    in_stock: bool
    
    def to_ui_component(self) -> Dict[str, Any]:
        """Convert to AG-UI component format"""
        return {
            "component": "FlowerCard",
            "props": {
                "id": self.id,
                "name": self.name,
                "description": self.description,
                "price": f"${self.price:.2f}",
                "imageUrl": self.image_url or "/placeholder-flower.jpg",
                "flowerType": self.flower_type,
                "occasions": self.occasion,
                "inStock": self.in_stock,
                "actions": [
                    {
                        "label": "View Details",
                        "action": "view_product",
                        "productId": self.id
                    },
                    {
                        "label": "Add to Cart",
                        "action": "add_to_cart",
                        "productId": self.id,
                        "disabled": not self.in_stock
                    }
                ]
            }
        }

class FlowerGrid(BaseModel):
    """Component for displaying multiple flower products in a grid"""
    title: str
    products: List[FlowerCard]
    
    def to_ui_component(self) -> Dict[str, Any]:
        """Convert to AG-UI component format"""
        return {
            "component": "FlowerGrid",
            "props": {
                "title": self.title,
                "products": [p.to_ui_component() for p in self.products],
                "layout": "grid",
                "columns": 3
            }
        }

class RecommendationCarousel(BaseModel):
    """Component for displaying recommendations in a carousel"""
    title: str
    subtitle: Optional[str]
    products: List[FlowerCard]
    recommendation_type: str
    
    def to_ui_component(self) -> Dict[str, Any]:
        """Convert to AG-UI component format"""
        return {
            "component": "RecommendationCarousel",
            "props": {
                "title": self.title,
                "subtitle": self.subtitle,
                "products": [p.to_ui_component() for p in self.products],
                "autoPlay": True,
                "slidesToShow": 4,
                "recommendationType": self.recommendation_type
            }
        }

class SearchFilters(BaseModel):
    """Component for search filters"""
    flower_types: List[str]
    occasions: List[str]
    price_range: Dict[str, float]
    
    def to_ui_component(self) -> Dict[str, Any]:
        """Convert to AG-UI component format"""
        return {
            "component": "SearchFilters",
            "props": {
                "filters": [
                    {
                        "type": "select",
                        "label": "Flower Type",
                        "name": "flower_type",
                        "options": self.flower_types,
                        "placeholder": "Select flower type"
                    },
                    {
                        "type": "select",
                        "label": "Occasion",
                        "name": "occasion",
                        "options": self.occasions,
                        "placeholder": "Select occasion"
                    },
                    {
                        "type": "range",
                        "label": "Price Range",
                        "name": "price",
                        "min": self.price_range.get("min", 0),
                        "max": self.price_range.get("max", 500),
                        "step": 10
                    }
                ],
                "onFilterChange": "handle_filter_change"
            }
        }

class ChatMessage(BaseModel):
    """Component for chat messages"""
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str]
    products: Optional[List[FlowerCard]] = None
    
    def to_ui_component(self) -> Dict[str, Any]:
        """Convert to AG-UI component format"""
        component = {
            "component": "ChatMessage",
            "props": {
                "role": self.role,
                "content": self.content,
                "timestamp": self.timestamp,
                "avatar": "/assistant-avatar.png" if self.role == "assistant" else None
            }
        }
        
        # Include products if present
        if self.products:
            component["props"]["attachments"] = [
                p.to_ui_component() for p in self.products
            ]
        
        return component

class QuickActions(BaseModel):
    """Component for quick action buttons"""
    actions: List[Dict[str, str]]
    
    def to_ui_component(self) -> Dict[str, Any]:
        """Convert to AG-UI component format"""
        return {
            "component": "QuickActions",
            "props": {
                "actions": [
                    {
                        "label": action["label"],
                        "action": action["action"],
                        "icon": action.get("icon"),
                        "variant": action.get("variant", "outline")
                    }
                    for action in self.actions
                ],
                "layout": "horizontal"
            }
        }

# UI Component Registry
UI_COMPONENTS = {
    "FlowerCard": FlowerCard,
    "FlowerGrid": FlowerGrid,
    "RecommendationCarousel": RecommendationCarousel,
    "SearchFilters": SearchFilters,
    "ChatMessage": ChatMessage,
    "QuickActions": QuickActions
}

def create_ui_response(component_type: str, **kwargs) -> Dict[str, Any]:
    """
    Create a UI response for CopilotKit integration
    
    Args:
        component_type: Type of component to create
        **kwargs: Component properties
        
    Returns:
        Formatted UI response
    """
    if component_type not in UI_COMPONENTS:
        raise ValueError(f"Unknown component type: {component_type}")
    
    component_class = UI_COMPONENTS[component_type]
    component = component_class(**kwargs)
    
    return {
        "type": "ui",
        "component": component.to_ui_component()
    }

# Example quick actions for the chat interface
DEFAULT_QUICK_ACTIONS = [
    {"label": "🌹 Show Roses", "action": "search", "query": "roses"},
    {"label": "🎂 Birthday Flowers", "action": "search", "query": "birthday"},
    {"label": "💐 Wedding Bouquets", "action": "search", "query": "wedding"},
    {"label": "💝 Anniversary", "action": "search", "query": "anniversary"},
    {"label": "🌷 Spring Collection", "action": "search", "query": "spring flowers"},
    {"label": "📈 Trending Now", "action": "trending", "query": ""},
]