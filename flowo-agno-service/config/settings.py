import os
import yaml
from typing import Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self, config_file: str = "settings.yaml"):
        self.config_file = Path(config_file)
        self._config = self._load_config()
        self._apply_env_overrides()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from YAML file"""
        if not self.config_file.exists():
            raise FileNotFoundError(f"Configuration file {self.config_file} not found")
        
        with open(self.config_file, 'r') as f:
            return yaml.safe_load(f)
    
    def _apply_env_overrides(self):
        """Apply environment variable overrides"""
        # Replace ${ENV_VAR} patterns in config
        self._replace_env_vars(self._config)
        
        # Override specific settings from environment
        if os.getenv("AGENT_PROVIDER"):
            self._config["agent"]["provider"] = os.getenv("AGENT_PROVIDER")
        
        if os.getenv("AGENT_MODEL"):
            self._config["agent"]["model_id"] = os.getenv("AGENT_MODEL")
        
        if os.getenv("DEBUG_MODE"):
            self._config["features"]["debug_mode"] = os.getenv("DEBUG_MODE", "false").lower() == "true"
        
        if os.getenv("SERVICE_PORT"):
            self._config["api"]["port"] = int(os.getenv("SERVICE_PORT"))
    
    def _replace_env_vars(self, obj: Any) -> Any:
        """Recursively replace ${ENV_VAR} patterns with environment values"""
        if isinstance(obj, dict):
            for key, value in obj.items():
                obj[key] = self._replace_env_vars(value)
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                obj[i] = self._replace_env_vars(item)
        elif isinstance(obj, str) and obj.startswith("${") and obj.endswith("}"):
            env_var = obj[2:-1]
            return os.getenv(env_var, obj)
        return obj
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value using dot notation"""
        keys = key.split(".")
        value = self._config
        
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default
        
        return value
    
    @property
    def agent_provider(self) -> str:
        return self.get("agent.provider", "openai")
    
    @property
    def agent_model(self) -> str:
        provider = self.agent_provider
        model_key = self.get("agent.model_id")
        
        # If model_id is a reference like "default" or "advanced"
        if model_key in ["default", "advanced"]:
            return self.get(f"agent.models.{provider}.{model_key}", model_key)
        
        return model_key or self.get(f"agent.models.{provider}.default", "gpt-4o-mini")
    
    @property
    def agent_name(self) -> str:
        return self.get("agent.name", "Flowo Assistant")
    
    @property
    def api_port(self) -> int:
        return self.get("api.port", 8082)
    
    @property
    def api_host(self) -> str:
        return self.get("api.host", "0.0.0.0")
    
    @property
    def backend_url(self) -> str:
        return os.getenv("BACKEND_API_URL", "http://localhost:8081/api/v1")
    
    @property
    def debug_mode(self) -> bool:
        return self.get("features.debug_mode", False)
    
    @property
    def memory_enabled(self) -> bool:
        return self.get("memory.enabled", True)
    
    @property
    def storage_enabled(self) -> bool:
        return self.get("storage.enabled", True)
    
    def get_api_keys(self) -> Dict[str, Optional[str]]:
        """Get all API keys from environment"""
        return {
            "openai": os.getenv("OPENAI_API_KEY"),
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "google": os.getenv("GOOGLE_API_KEY"),
        }

# Singleton instance
settings = Settings()