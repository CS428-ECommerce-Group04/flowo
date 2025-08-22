import { useState, KeyboardEvent } from 'react';
import { Send, Flower, Gift, DollarSign, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (!inputValue.trim() || disabled) return;
    
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50 rounded-b-2xl">
      <div className="flex space-x-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Assistant is typing..." : "Ask about flowers, search products, or get recommendations..."}
          disabled={disabled}
          className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent text-base placeholder:text-gray-400 disabled:opacity-50 disabled:bg-gray-50 shadow-sm transition-all duration-200"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || disabled}
          className="px-5 py-3.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center min-w-[50px]"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
      
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => !disabled && onSendMessage("Show me roses")}
          disabled={disabled}
          className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <Flower className="w-3 h-3" />Roses
        </button>
        <button
          onClick={() => !disabled && onSendMessage("Flowers for birthday")}
          disabled={disabled}
          className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <Gift className="w-3 h-3" />Birthday
        </button>
        <button
          onClick={() => !disabled && onSendMessage("Show budget flowers")}
          disabled={disabled}
          className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <DollarSign className="w-3 h-3" />Budget
        </button>
        <button
          onClick={() => !disabled && onSendMessage("Recommend flowers for anniversary")}
          disabled={disabled}
          className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          <Heart className="w-3 h-3" />Anniversary
        </button>
      </div>
    </div>
  );
}