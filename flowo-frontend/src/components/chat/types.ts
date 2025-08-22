/**
 * Shared types for the chat components
 */

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  products?: Product[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url?: string;
  flower_type?: string;
  occasion?: string[];
  in_stock?: boolean;
}

export interface FlowerData {
  name: string;
  price: number;
  description: string;
  occasion: string;
}

export interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}