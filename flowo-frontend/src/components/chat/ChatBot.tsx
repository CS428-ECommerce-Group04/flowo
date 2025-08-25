import { useState, useRef, useEffect } from 'react';
import { agnoService } from '@/services/agnoService';
import { generateFallbackResponse } from './fallbackResponses';
import { detectToolCall, executeTool } from './chatTools';
import { useCart } from '@/store/cart';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import type { Message, ChatBotProps } from './types';
import type { ApiProduct } from '@/types/product';

const getWelcomeMessage = (): Message => ({
  id: '1',
  text: "Hello! Welcome to Bloom & Blossom! 🌸 How can I help you today?\n\nYou can:\n• Search for flowers (e.g., 'show me roses')\n• Get recommendations (e.g., 'flowers for birthday')\n• Add to cart (e.g., 'add product 1 to cart')\n• Ask about products (e.g., 'tell me about product 3')",
  isUser: false,
  timestamp: new Date()
});

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
  const cartStore = useCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI service availability on mount and periodically
  useEffect(() => {
    const checkAIService = async () => {
      const available = await agnoService.checkHealth();
      setIsAIEnabled(available);
    };

    checkAIService();
    const interval = setInterval(checkAIService, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get user ID from localStorage or generate one
  const getUserId = (): string => {
    let userId = localStorage.getItem('chatUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('chatUserId', userId);
    }
    return userId;
  };

  // Fetch products from backend API
  const fetchProductsByIds = async (productIds: number[]): Promise<ApiProduct[]> => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api/v1";
    
    try {
      // Fetch all products and filter by IDs
      // In production, you'd have an endpoint like /products?ids=1,2,3
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      
      const data = await response.json();
      const allProducts: ApiProduct[] = data.data || [];
      
      // Filter products by the requested IDs
      return allProducts.filter((p: ApiProduct) => 
        productIds.includes(p.id || p.product_id || 0)
      );
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return mock data as fallback
      return productIds.map(id => ({
        id,
        product_id: id,
        name: `Product ${id}`,
        description: 'Product details unavailable',
        current_price: 29.99,
        stock_quantity: 10
      }));
    }
  };

  // Format products for display in chat
  const formatProductsForChat = (products: ApiProduct[]): string => {
    if (products.length === 0) return "No products found.";
    
    let response = "Here are the products I found:\n\n";
    products.forEach((product, index) => {
      const price = product.current_price || product.base_price || 0;
      response += `${index + 1}. **${product.name}** (ID: ${product.id || product.product_id})\n`;
      response += `   💰 $${price.toFixed(2)}`;
      if (product.stock_quantity) {
        response += ` | ${product.stock_quantity} in stock`;
      }
      if (product.description) {
        response += `\n   📝 ${product.description.substring(0, 100)}...`;
      }
      response += '\n\n';
    });
    
    response += "💡 Tip: You can add any product to cart by saying 'add product [ID] to cart'";
    return response;
  };

  const parseProductsFromResponse = (response: string): { text: string; products: any[] } => {
    // Simple parser to extract product information from AI response
    // This could be enhanced based on the actual response format
    const productPattern = /\*\*([^*]+)\*\* \(\$(\d+(?:\.\d{2})?)\)/g;
    const products: any[] = [];
    let match;
    let productId = 1;

    while ((match = productPattern.exec(response)) !== null) {
      products.push({
        id: productId++,
        name: match[1],
        price: parseFloat(match[2]),
        description: '',
        in_stock: true
      });
    }

    return { text: response, products };
  };

  const handleSendMessage = async (inputValue: string) => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Add a small delay before showing typing indicator for more natural feel
    setTimeout(() => setIsTyping(true), 300);

    let response: string = '';
    let responseDelay: number = 2000; // Base delay for more realistic responses
    let productsToDisplay: any[] = [];

    // First, check if user is trying to use a tool
    const toolCall = detectToolCall(inputValue);
    
    if (toolCall) {
      // Execute the tool
      const toolResult = await executeTool(toolCall);
      
      if (toolResult.success) {
        // Handle different tool results
        if (toolCall.tool === 'searchProducts' || toolCall.tool === 'getRecommendations') {
          // Fetch actual products from backend
          const productIds = toolResult.data?.productIds || [];
          if (productIds.length > 0) {
            const products = await fetchProductsByIds(productIds);
            response = formatProductsForChat(products);
            productsToDisplay = products.map(p => ({
              id: p.id || p.product_id,
              name: p.name,
              price: p.current_price || p.base_price || 0,
              description: p.description || '',
              in_stock: (p.stock_quantity || 0) > 0
            }));
          } else {
            response = "No products found matching your criteria. Try a different search!";
          }
        } else if (toolCall.tool === 'addToCart') {
          // Add to cart
          const { productId, quantity } = toolResult.data;
          const products = await fetchProductsByIds([productId]);
          
          if (products.length > 0) {
            const product = products[0];
            cartStore.add(product.id || product.product_id || 0, quantity || 1);
            response = `✅ Successfully added ${quantity} × **${product.name}** to your cart!\n\nCart now has ${cartStore.itemCount()} item(s). Total: $${cartStore.subtotal().toFixed(2)}`;
          } else {
            response = "Sorry, I couldn't find that product. Please check the product ID.";
          }
        } else if (toolCall.tool === 'getProductDetails') {
          // Get product details
          const { productId } = toolResult.data;
          const products = await fetchProductsByIds([productId]);
          
          if (products.length > 0) {
            const product = products[0];
            response = `**${product.name}**\n\n`;
            response += `📝 ${product.description || 'No description available'}\n\n`;
            response += `💰 Price: $${(product.current_price || product.base_price || 0).toFixed(2)}\n`;
            response += `📦 Stock: ${product.stock_quantity || 'Unknown'}\n`;
            if (product.average_rating) {
              response += `⭐ Rating: ${product.average_rating}/5 (${product.review_count} reviews)\n`;
            }
            response += `\nWould you like to add this to your cart?`;
            
            productsToDisplay = [{
              id: product.id || product.product_id,
              name: product.name,
              price: product.current_price || product.base_price || 0,
              description: product.description || '',
              in_stock: (product.stock_quantity || 0) > 0
            }];
          } else {
            response = "Product not found. Please check the product ID.";
          }
        }
        
        // Calculate delay based on response length for more natural feel
        responseDelay = Math.min(3500, Math.max(1500, response.length * 10));
      } else {
        response = toolResult.message || "Sorry, I couldn't process that request.";
        responseDelay = 1200;
      }
    } else if (isAIEnabled) {
      // Try AI service if no tool detected
      try {
        const aiResponse = await agnoService.sendMessage(inputValue, getUserId());
        
        if (aiResponse) {
          response = aiResponse;
          responseDelay = 500;
        } else {
          response = generateFallbackResponse(inputValue);
          responseDelay = Math.min(2000, Math.max(1000, response.length * 15));
          setIsAIEnabled(false);
        }
      } catch (error) {
        console.error('AI service error, falling back:', error);
        response = generateFallbackResponse(inputValue);
        responseDelay = Math.min(2000, Math.max(1000, response.length * 15));
        setIsAIEnabled(false);
      }
    } else {
      // Use fallback response
      response = generateFallbackResponse(inputValue);
      responseDelay = Math.min(2000, Math.max(1000, response.length * 15));
    }

    // Parse response for products if not already set
    if (productsToDisplay.length === 0) {
      const { text, products } = parseProductsFromResponse(response);
      response = text;
      productsToDisplay = products;
    }

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        products: productsToDisplay.length > 0 ? productsToDisplay : undefined
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, responseDelay);
  };

  const handleRefresh = () => {
    setMessages([getWelcomeMessage()]);
    setIsTyping(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-[32rem] h-[40rem] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out">
      <ChatHeader onClose={onClose} isAIEnabled={isAIEnabled} onRefresh={handleRefresh} />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-gray-50 to-white">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
    </div>
  );
}