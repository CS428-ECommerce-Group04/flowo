import { useState, useRef, useEffect } from 'react';
import { agnoService } from '@/services/agnoService';
import { generateFallbackResponse } from './fallbackResponses';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import type { Message, ChatBotProps } from './types';

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! Welcome to Bloom & Blossom! 🌸 How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(false);
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
    setIsTyping(true);

    let response: string;
    let responseDelay: number;

    // Try AI service first if available
    if (isAIEnabled) {
      try {
        const aiResponse = await agnoService.sendMessage(inputValue, getUserId());
        
        if (aiResponse) {
          response = aiResponse;
          responseDelay = 500; // Quick response for AI
        } else {
          // AI service returned null, fall back to rule-based
          response = generateFallbackResponse(inputValue);
          responseDelay = Math.min(2000, Math.max(1000, response.length * 15));
          setIsAIEnabled(false); // Mark as unavailable
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

    // Parse response for products
    const { text, products } = parseProductsFromResponse(response);

    // Simulate typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text,
        isUser: false,
        timestamp: new Date(),
        products: products.length > 0 ? products : undefined
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, responseDelay);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[32rem] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      <ChatHeader onClose={onClose} isAIEnabled={isAIEnabled} />

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
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