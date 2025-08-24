"""
Model Provider Abstraction
Supports multiple LLM providers with a unified interface
"""

from typing import Optional, Any
from agno.models.openai import OpenAIChat
from agno.models.anthropic import Claude
from agno.models.groq import Groq
from config import settings

class ModelProvider:
    """Base class for model providers"""
    
    @staticmethod
    def get_model(provider: str, model_id: Optional[str] = None, **kwargs) -> Any:
        """Get model instance based on provider"""
        
        provider = provider.lower()
        api_keys = settings.get_api_keys()
        
        # Get model ID from settings if not provided
        if not model_id:
            model_id = settings.agent_model
        
        # Get provider-specific settings
        temperature = kwargs.get('temperature', settings.get('agent.temperature', 0.7))
        max_tokens = kwargs.get('max_tokens', settings.get('agent.max_tokens', 2000))
        
        if provider == 'openai':
            if not api_keys.get('openai'):
                raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable.")
            
            return OpenAIChat(
                id=model_id,
                api_key=api_keys['openai'],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        
        elif provider == 'anthropic':
            if not api_keys.get('anthropic'):
                raise ValueError("Anthropic API key not found. Set ANTHROPIC_API_KEY environment variable.")
            
            return Claude(
                id=model_id,
                api_key=api_keys['anthropic'],
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        
        elif provider == 'groq':
            # Groq uses OpenAI-compatible API
            if not api_keys.get('groq'):
                api_keys['groq'] = api_keys.get('openai')  # Fallback to OpenAI key if configured
            
            return Groq(
                id=model_id,
                api_key=api_keys.get('groq'),
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    @staticmethod
    def get_embedding_model(provider: str = "openai", **kwargs) -> Any:
        """Get embedding model for knowledge base"""
        
        from agno.embedder.openai import OpenAIEmbedder
        
        api_keys = settings.get_api_keys()
        
        if provider == 'openai':
            if not api_keys.get('openai'):
                raise ValueError("OpenAI API key not found for embeddings.")
            
            model_id = kwargs.get('model_id', settings.get('agent.models.openai.embedding', 'text-embedding-3-small'))
            
            return OpenAIEmbedder(
                id=model_id,
                api_key=api_keys['openai'],
                dimensions=kwargs.get('dimensions', 1536)
            )
        
        # Add more embedding providers as needed
        else:
            raise ValueError(f"Unsupported embedding provider: {provider}")

def get_model_provider(
    provider: Optional[str] = None,
    model_id: Optional[str] = None,
    **kwargs
) -> Any:
    """
    Factory function to get model provider
    
    Args:
        provider: Provider name (openai, anthropic, etc.)
        model_id: Specific model ID
        **kwargs: Additional model parameters
    
    Returns:
        Model instance
    """
    if not provider:
        provider = settings.agent_provider
    
    return ModelProvider.get_model(provider, model_id, **kwargs)