import httpx
import os
from typing import Optional, List, Dict, Any
from agno.tools import Toolkit
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class ProductSearchParams(BaseModel):
    query: Optional[str] = Field(None, description="Search query for product name or description")
    flower_type: Optional[str] = Field(None, description="Filter by flower type (e.g., roses, tulips, lilies)")
    occasion: Optional[str] = Field(None, description="Filter by occasion (e.g., birthday, wedding, anniversary)")
    price_min: Optional[float] = Field(None, description="Minimum price filter")
    price_max: Optional[float] = Field(None, description="Maximum price filter")
    condition: Optional[str] = Field(None, description="Filter by condition: NewFlower, OldFlower, LowStock")
    sort_by: Optional[str] = Field(None, description="Sort by: price_asc, price_desc, name_asc, name_desc, newest, best_selling")
    page: int = Field(1, description="Page number")
    limit: int = Field(10, description="Items per page")

class RecommendationParams(BaseModel):
    recommendation_type: str = Field(..., description="Type: personalized, similar, trending, occasion_based, price_based")
    firebase_uid: Optional[str] = Field(None, description="User ID for personalized recommendations")
    session_id: Optional[str] = Field(None, description="Session ID for anonymous users")
    product_id: Optional[int] = Field(None, description="Product ID for similar recommendations")
    occasion: Optional[str] = Field(None, description="Occasion for occasion-based recommendations")
    price_min: Optional[float] = Field(None, description="Minimum price for price-based recommendations")
    price_max: Optional[float] = Field(None, description="Maximum price for price-based recommendations")
    limit: int = Field(10, description="Number of recommendations")

class FlowerTools(Toolkit):
    def __init__(self, api_url: Optional[str] = None):
        super().__init__(name="flower_tools")
        self.api_url = api_url or os.getenv("BACKEND_API_URL", "http://localhost:8081/api/v1")
        self.register(self.search_products)
        self.register(self.get_recommendations)
        self.register(self.get_product_details)
        self.register(self.get_trending_flowers)
        self.register(self.get_occasions)
        self.register(self.get_flower_types)

    def search_products(self, params: ProductSearchParams) -> Dict[str, Any]:
        """
        Search for flower products with advanced filters.
        
        Args:
            params: Search parameters including query, filters, and pagination
            
        Returns:
            Search results with products matching the criteria
        """
        try:
            with httpx.Client() as client:
                # Build query parameters
                query_params = {}
                if params.query:
                    query_params["query"] = params.query
                if params.flower_type:
                    query_params["flower_type"] = params.flower_type
                if params.occasion:
                    query_params["occasion"] = params.occasion
                if params.price_min is not None:
                    query_params["price_min"] = params.price_min
                if params.price_max is not None:
                    query_params["price_max"] = params.price_max
                if params.condition:
                    query_params["condition"] = params.condition
                if params.sort_by:
                    query_params["sort_by"] = params.sort_by
                query_params["page"] = params.page
                query_params["limit"] = params.limit

                response = client.get(
                    f"{self.api_url}/products/search",
                    params=query_params,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Search failed with status {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"error": f"Failed to search products: {str(e)}"}

    def get_recommendations(self, params: RecommendationParams) -> Dict[str, Any]:
        """
        Get personalized flower recommendations based on various criteria.
        
        Args:
            params: Recommendation parameters including type and filters
            
        Returns:
            Recommended products based on the specified criteria
        """
        try:
            with httpx.Client() as client:
                # Build query parameters
                query_params = {
                    "recommendation_type": params.recommendation_type,
                    "limit": params.limit
                }
                
                if params.firebase_uid:
                    query_params["firebase_uid"] = params.firebase_uid
                if params.session_id:
                    query_params["session_id"] = params.session_id
                if params.product_id is not None:
                    query_params["product_id"] = params.product_id
                if params.occasion:
                    query_params["occasion"] = params.occasion
                if params.price_min is not None:
                    query_params["price_min"] = params.price_min
                if params.price_max is not None:
                    query_params["price_max"] = params.price_max

                response = client.get(
                    f"{self.api_url.replace('/v1', '')}/recommendations",
                    params=query_params,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Recommendations failed with status {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"error": f"Failed to get recommendations: {str(e)}"}

    def get_product_details(self, product_id: int) -> Dict[str, Any]:
        """
        Get detailed information about a specific flower product.
        
        Args:
            product_id: The ID of the product to retrieve
            
        Returns:
            Detailed product information
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.api_url}/products/{product_id}",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Failed to get product details with status {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"error": f"Failed to get product details: {str(e)}"}

    def get_trending_flowers(self, limit: int = 10) -> Dict[str, Any]:
        """
        Get currently trending flower products.
        
        Args:
            limit: Number of trending products to return
            
        Returns:
            List of trending flower products
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.api_url.replace('/v1', '')}/recommendations/trending",
                    params={"limit": limit},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Failed to get trending flowers with status {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"error": f"Failed to get trending flowers: {str(e)}"}

    def get_occasions(self) -> Dict[str, Any]:
        """
        Get list of available occasions for flower recommendations.
        
        Returns:
            List of occasions
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.api_url}/occasions",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Failed to get occasions with status {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"error": f"Failed to get occasions: {str(e)}"}

    def get_flower_types(self) -> Dict[str, Any]:
        """
        Get list of available flower types.
        
        Returns:
            List of flower types
        """
        try:
            with httpx.Client() as client:
                response = client.get(
                    f"{self.api_url}/flower-types",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {
                        "error": f"Failed to get flower types with status {response.status_code}",
                        "details": response.text
                    }
        except Exception as e:
            return {"error": f"Failed to get flower types: {str(e)}"}