"""
Agent Manager
Handles agent creation and lifecycle
"""

from typing import Optional, List, Dict, Any
from agno.agent import Agent
from agno.tools.reasoning import ReasoningTools
from config import settings
from .providers import get_model_provider
from memory.manager import MemoryManager
from storage.manager import StorageManager
from tools.flower_tools import FlowerTools

class AgentManager:
    def __init__(self):
        self.memory_manager = MemoryManager() if settings.memory_enabled else None
        self.storage_manager = StorageManager() if settings.storage_enabled else None
        self.agent = self._create_agent()
    
    def _create_agent(self) -> Agent:
        """Create and configure the agent"""
        
        # Get model provider
        model = get_model_provider()
        
        # Configure tools
        tools = []
        
        if settings.get("tools.reasoning.enabled", True):
            tools.append(ReasoningTools(
                add_instructions=settings.get("tools.reasoning.add_instructions", True)
            ))
        
        if settings.get("tools.flower_search.enabled", True):
            tools.append(FlowerTools(
                api_url=settings.backend_url
            ))
        
        # Agent configuration
        agent_config = {
            "name": settings.agent_name,
            "model": model,
            "tools": tools,
            "instructions": self._get_instructions(),
            "markdown": settings.get("features.markdown", True),
            "debug_mode": settings.debug_mode,
        }
        
        # Add memory if enabled
        if self.memory_manager:
            agent_config["memory"] = self.memory_manager.get_memory()
            agent_config["enable_agentic_memory"] = settings.get("features.enable_agentic_memory", True)
        
        # Add storage if enabled
        if self.storage_manager:
            agent_config["storage"] = self.storage_manager.get_storage()
            agent_config["add_history_to_messages"] = settings.get("features.add_history_to_messages", True)
            agent_config["num_history_runs"] = settings.get("storage.num_history_runs", 5)
        
        return Agent(**agent_config)
    
    def _get_instructions(self) -> List[str]:
        """Get agent instructions"""
        return [
            f"You are {settings.agent_name}, a helpful AI that assists customers in finding the perfect flowers.",
            "Help users discover beautiful flower arrangements for any occasion.",
            "Provide personalized recommendations based on user preferences and past interactions.",
            "When searching for products, consider the user's budget, occasion, and flower preferences.",
            "Present product information in a clear, organized manner.",
            "If a user mentions preferences (favorite flowers, colors, occasions), remember them for future interactions.",
            "Be friendly, helpful, and knowledgeable about flowers and their meanings.",
            "When showing products, include key details like price, flower types, and occasions they're suitable for.",
            "Use tables or structured formats to display multiple products for easy comparison.",
            "Always be honest about product availability and pricing.",
        ]
    
    def get_response(self, message: str, user_id: str = "default", stream: bool = True) -> Any:
        """
        Get agent response for a user message
        
        Args:
            message: User's message
            user_id: User identifier for personalization
            stream: Whether to stream the response
        
        Returns:
            Agent's response
        """
        self.agent.user_id = user_id
        
        if stream:
            return self.agent.print_response(
                message,
                stream=True,
                show_full_reasoning=False,
                stream_intermediate_steps=True
            )
        else:
            return self.agent.run(message)
    
    def get_response_dict(self, message: str, user_id: str = "default") -> Dict[str, Any]:
        """
        Get agent response as a dictionary for API responses
        
        Args:
            message: User's message
            user_id: User identifier for personalization
        
        Returns:
            Dictionary with agent's response
        """
        self.agent.user_id = user_id
        
        try:
            response = self.agent.run(message)
            
            if hasattr(response, 'content'):
                return {
                    "response": response.content,
                    "user_id": user_id,
                    "success": True,
                    "provider": settings.agent_provider,
                    "model": settings.agent_model
                }
            else:
                return {
                    "response": str(response),
                    "user_id": user_id,
                    "success": True,
                    "provider": settings.agent_provider,
                    "model": settings.agent_model
                }
        except Exception as e:
            return {
                "response": f"Error: {str(e)}",
                "user_id": user_id,
                "success": False,
                "error": str(e)
            }
    
    def reload_agent(self):
        """Reload agent with updated configuration"""
        self.agent = self._create_agent()

# Singleton instance
agent_manager = AgentManager()