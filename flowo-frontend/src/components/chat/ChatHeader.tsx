import { X, Flower2, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
  isAIEnabled: boolean;
  onRefresh: () => void;
}

export default function ChatHeader({ onClose, isAIEnabled, onRefresh }: ChatHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-green-700 to-green-800 text-white p-6 rounded-t-2xl flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center shadow-md">
          <Flower2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Bloom & Blossom Assistant</h3>
          <div className="flex items-center space-x-2 text-sm text-green-100">
            <span className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${isAIEnabled ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></span>
              {isAIEnabled ? 'AI Powered' : 'Smart Assistant'}
            </span>
            <span className="text-green-300">•</span>
            <span>Always here to help</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="text-green-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200 group"
          title="Refresh chat"
        >
          <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>
        <button
          onClick={onClose}
          className="text-green-200 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all duration-200"
          title="Close chat"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}