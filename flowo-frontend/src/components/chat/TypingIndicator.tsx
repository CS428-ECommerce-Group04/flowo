export default function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fadeIn">
      <div className="bg-white text-gray-800 px-5 py-3.5 rounded-2xl rounded-bl-sm shadow-md border border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
          <span className="text-sm text-gray-500 ml-1">Assistant is typing</span>
        </div>
      </div>
    </div>
  );
}