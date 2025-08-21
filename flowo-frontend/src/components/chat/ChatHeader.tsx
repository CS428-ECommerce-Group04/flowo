interface ChatHeaderProps {
  onClose: () => void;
  isAIEnabled: boolean;
}

export default function ChatHeader({ onClose, isAIEnabled }: ChatHeaderProps) {
  return (
    <div className="bg-green-800 text-white p-5 rounded-t-lg flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-lg">
          🌸
        </div>
        <div>
          <h3 className="font-semibold text-base">Bloom & Blossom</h3>
          <p className="text-sm text-green-100">
            {isAIEnabled ? '🤖 AI Assistant' : 'Online now'}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-green-100 hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}