"""
Legacy agent module - imports from new structure for backward compatibility
"""

from core import agent_manager

# Export the singleton instance for backward compatibility
flowo_agent = agent_manager

# Legacy FlowoAgent class for backward compatibility
class FlowoAgent:
    def __init__(self):
        # Use the global agent_manager instance
        pass
    
    def get_response(self, message: str, user_id: str = "default", stream: bool = True):
        return agent_manager.get_response(message, user_id, stream)
    
    def get_response_dict(self, message: str, user_id: str = "default"):
        return agent_manager.get_response_dict(message, user_id)

# For backward compatibility with existing imports
if __name__ == "__main__":
    # Test the agent
    print("Testing Flowo Agent...")
    print("-" * 50)
    
    # Test search
    response = agent_manager.get_response_dict("Show me red roses under $50", user_id="test_user")
    print(response)
    
    print("-" * 50)
    
    # Test recommendations
    response = agent_manager.get_response_dict("What flowers do you recommend for a wedding?", user_id="test_user")
    print(response)