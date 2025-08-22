import os
from agno.agent import Agent
from agno.models.anthropic import Claude
from agno.models.openai import OpenAI
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.storage.sqlite import SqliteStorage
from agno.tools.reasoning import ReasoningTools
from tools.flower_tools import FlowerTools
from dotenv import load_dotenv

load_dotenv()

class FlowoAgent:
    def __init__(self):
        # Initialize memory for personalization
        self.memory = Memory(
            model=Claude(id="claude-sonnet-3-5-20241022"),
            db=SqliteMemoryDb(table_name="user_preferences", db_file="tmp/flowo.db"),
            delete_memories=False,
            clear_memories=False,
        )
        
        # Initialize storage for conversation history
        self.storage = SqliteStorage(
            table_name="agent_sessions", 
            db_file="tmp/flowo.db"
        )
        
        # Initialize the main agent
        self.agent = Agent(
            name="Flowo Assistant",
            model=Claude(id="claude-sonnet-3-5-20241022"),
            tools=[
                ReasoningTools(add_instructions=True),
                FlowerTools(api_url=os.getenv("BACKEND_API_URL")),
            ],
            instructions=[
                "You are Flowo Assistant, a helpful AI that assists customers in finding the perfect flowers.",
                "Help users discover beautiful flower arrangements for any occasion.",
                "Provide personalized recommendations based on user preferences and past interactions.",
                "When searching for products, consider the user's budget, occasion, and flower preferences.",
                "Present product information in a clear, organized manner.",
                "If a user mentions preferences (favorite flowers, colors, occasions), remember them for future interactions.",
                "Be friendly, helpful, and knowledgeable about flowers and their meanings.",
                "When showing products, include key details like price, flower types, and occasions they're suitable for.",
                "Use tables or structured formats to display multiple products for easy comparison.",
            ],
            memory=self.memory,
            storage=self.storage,
            enable_agentic_memory=True,
            add_history_to_messages=True,
            num_history_runs=5,
            markdown=True,
            debug_mode=os.getenv("DEBUG_MODE", "false").lower() == "true",
        )
    
    def get_response(self, message: str, user_id: str = "default", stream: bool = True):
        """
        Get agent response for a user message.
        
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
    
    def get_response_dict(self, message: str, user_id: str = "default"):
        """
        Get agent response as a dictionary for API responses.
        
        Args:
            message: User's message
            user_id: User identifier for personalization
            
        Returns:
            Dictionary with agent's response
        """
        self.agent.user_id = user_id
        response = self.agent.run(message)
        
        if hasattr(response, 'content'):
            return {
                "response": response.content,
                "user_id": user_id,
                "success": True
            }
        else:
            return {
                "response": str(response),
                "user_id": user_id,
                "success": True
            }

# Create a singleton instance
flowo_agent = FlowoAgent()

if __name__ == "__main__":
    # Test the agent
    agent = FlowoAgent()
    
    # Example queries
    print("Testing Flowo Agent...")
    print("-" * 50)
    
    # Test search
    agent.get_response("Show me red roses under $50", user_id="test_user")
    
    print("-" * 50)
    
    # Test recommendations
    agent.get_response("What flowers do you recommend for a wedding?", user_id="test_user")
    
    print("-" * 50)
    
    # Test personalization
    agent.get_response("My favorite flowers are tulips and I love purple colors", user_id="test_user")
    agent.get_response("What flowers would you recommend for me?", user_id="test_user")