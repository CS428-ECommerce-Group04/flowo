#!/usr/bin/env python3
"""Test imports from agno"""

try:
    from agno.models.openai import OpenAIChat
    print("✓ OpenAIChat imported successfully")
except ImportError as e:
    print(f"✗ OpenAIChat import failed: {e}")

try:
    from agno.models.openai import OpenAI
    print("✓ OpenAI imported successfully")
except ImportError as e:
    print(f"✗ OpenAI import failed: {e}")

try:
    import agno.models.openai as openai_module
    print(f"Available in openai module: {dir(openai_module)}")
except ImportError as e:
    print(f"✗ Failed to import openai module: {e}")