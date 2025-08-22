"""
Base Tool Class
Provides a foundation for creating custom tools
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from agno.tools import Toolkit

class BaseTool(Toolkit, ABC):
    """Base class for all custom tools"""
    
    def __init__(self, name: str, description: Optional[str] = None):
        super().__init__(name=name)
        self.description = description or f"{name} tool"
        self._register_methods()
    
    @abstractmethod
    def _register_methods(self):
        """Register tool methods - must be implemented by subclasses"""
        pass
    
    def handle_error(self, error: Exception, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Standard error handling for tools"""
        error_response = {
            "error": str(error),
            "error_type": type(error).__name__,
            "success": False
        }
        
        if context:
            error_response["context"] = context
        
        return error_response
    
    def validate_params(self, params: Dict[str, Any], required: list) -> bool:
        """Validate required parameters"""
        missing = [p for p in required if p not in params or params[p] is None]
        if missing:
            raise ValueError(f"Missing required parameters: {', '.join(missing)}")
        return True