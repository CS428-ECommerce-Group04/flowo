"""
Memory Manager
Handles agent memory for personalization
"""

from typing import Optional
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from config import settings
from core.providers import get_model_provider

class MemoryManager:
    def __init__(self):
        self.memory = None
        if settings.memory_enabled:
            self.memory = self._create_memory()
    
    def _create_memory(self) -> Memory:
        """Create memory instance"""
        
        # Get model for memory management
        model = get_model_provider()
        
        # Create database connection
        db = SqliteMemoryDb(
            table_name=settings.get("memory.table_name", "user_preferences"),
            db_file=settings.get("memory.database_file", "tmp/flowo.db")
        )
        
        return Memory(
            model=model,
            db=db,
            delete_memories=settings.get("memory.delete_memories", False),
            clear_memories=settings.get("memory.clear_memories", False),
        )
    
    def get_memory(self) -> Optional[Memory]:
        """Get memory instance"""
        return self.memory
    
    def clear_user_memory(self, user_id: str):
        """Clear memory for a specific user"""
        if self.memory:
            # Implementation depends on Memory API
            pass
    
    def get_user_memories(self, user_id: str):
        """Get memories for a specific user"""
        if self.memory:
            # Implementation depends on Memory API
            pass