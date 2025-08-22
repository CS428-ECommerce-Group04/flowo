import { X, MessageCircle } from 'lucide-react';

interface ChatToggleProps {
  isOpen: boolean;
  onClick: () => void;
  hasUnreadMessages?: boolean;
}

export default function ChatToggle({ isOpen, onClick, hasUnreadMessages = false }: ChatToggleProps) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-4 right-4 w-16 h-16 rounded-full shadow-2xl transition-all duration-300 z-40 flex items-center justify-center group ${ 
        isOpen 
          ? 'bg-gray-600 hover:bg-gray-700 scale-90' 
          : 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 hover:scale-110'
      }`}
    >
      {hasUnreadMessages && !isOpen && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-xs text-white font-bold">!</span>
        </div>
      )}

      {isOpen ? (
        <X className="w-7 h-7 text-white" />
      ) : (
        <>
          <MessageCircle className="w-7 h-7 text-white" />
          <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        </>
      )}
      
      {/* Ripple effect for attention */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-20"></div>
      )}
    </button>
  );
}
