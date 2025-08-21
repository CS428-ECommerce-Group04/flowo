#!/usr/bin/env python3
"""
Test script for Flowo Agno Service
"""

import httpx
import json
import asyncio
from typing import Dict, Any

# Service configuration
SERVICE_URL = "http://localhost:8082"
BACKEND_URL = "http://localhost:8081"

def print_response(title: str, response: Dict[str, Any]):
    """Pretty print API response"""
    print(f"\n{'='*60}")
    print(f" {title}")
    print('='*60)
    print(json.dumps(response, indent=2))

async def test_health():
    """Test health endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{SERVICE_URL}/health")
        print_response("Health Check", response.json())
        return response.status_code == 200

async def test_chat():
    """Test chat endpoint"""
    async with httpx.AsyncClient() as client:
        payload = {
            "message": "Show me red roses under $50",
            "user_id": "test_user",
            "stream": False
        }
        response = await client.post(
            f"{SERVICE_URL}/api/chat",
            json=payload,
            timeout=30.0
        )
        print_response("Chat Response", response.json())
        return response.status_code == 200

async def test_search():
    """Test search endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICE_URL}/api/search",
            params={
                "query": "roses",
                "price_max": 50,
                "limit": 5
            },
            timeout=10.0
        )
        print_response("Search Results", response.json())
        return response.status_code == 200

async def test_recommendations():
    """Test recommendations endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SERVICE_URL}/api/recommendations",
            params={
                "recommendation_type": "trending",
                "limit": 5
            },
            timeout=10.0
        )
        print_response("Recommendations", response.json())
        return response.status_code == 200

async def test_occasions():
    """Test occasions endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SERVICE_URL}/api/occasions",
            timeout=10.0
        )
        print_response("Occasions", response.json())
        return response.status_code == 200

async def test_flower_types():
    """Test flower types endpoint"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SERVICE_URL}/api/flower-types",
            timeout=10.0
        )
        print_response("Flower Types", response.json())
        return response.status_code == 200

async def check_backend():
    """Check if backend is accessible"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BACKEND_URL}/health",
                timeout=5.0
            )
            return response.status_code == 200
    except:
        return False

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print(" Flowo Agno Service Test Suite")
    print("="*60)
    
    # Check backend first
    print("\n📡 Checking backend connectivity...")
    backend_ok = await check_backend()
    if not backend_ok:
        print("⚠️  Warning: Backend service is not accessible at", BACKEND_URL)
        print("   Some tests may fail. Make sure the backend is running.")
    else:
        print("✅ Backend is accessible")
    
    # Run tests
    tests = [
        ("Health Check", test_health),
        ("Search Products", test_search),
        ("Get Recommendations", test_recommendations),
        ("Get Occasions", test_occasions),
        ("Get Flower Types", test_flower_types),
        ("Chat with Agent", test_chat),
    ]
    
    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Testing: {test_name}...")
        try:
            success = await test_func()
            results.append((test_name, success))
            if success:
                print(f"✅ {test_name} passed")
            else:
                print(f"❌ {test_name} failed")
        except Exception as e:
            print(f"❌ {test_name} error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print(" Test Summary")
    print("="*60)
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    for test_name, success in results:
        status = "✅" if success else "❌"
        print(f"  {status} {test_name}")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")

if __name__ == "__main__":
    print("\n🚀 Starting Flowo Agno Service Tests...")
    print("   Make sure the service is running on port 8082")
    print("   You can start it with: docker-compose -f docker-compose.dev.yml up agno-dev")
    
    asyncio.run(main())