"""
Storage Manager
Handles conversation history storage
"""

from typing import Optional
from agno.storage.sqlite import SqliteStorage
from config import settings

class StorageManager:
    def __init__(self):
        self.storage = None
        if settings.storage_enabled:
            self.storage = self._create_storage()
    
    def _create_storage(self) -> SqliteStorage:
        """Create storage instance"""
        
        return SqliteStorage(
            table_name=settings.get("storage.table_name", "agent_sessions"),
            db_file=settings.get("storage.database_file", "tmp/flowo.db")
        )
    
    def get_storage(self) -> Optional[SqliteStorage]:
        """Get storage instance"""
        return self.storage
    
    def clear_user_history(self, user_id: str):
        """Clear conversation history for a specific user"""
        if self.storage:
            # Implementation depends on Storage API
            pass