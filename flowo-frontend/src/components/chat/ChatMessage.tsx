import type { Message, Product } from './types';

interface ChatMessageProps {
  message: Message;
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="mt-2 p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start space-x-3">
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-16 h-16 rounded-md object-cover"
          />
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{product.name}</h4>
          <p className="text-xs text-gray-600 mt-1">{product.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-bold text-green-600">${product.price}</span>
            {product.in_stock !== undefined && (
              <span className={`text-xs ${product.in_stock ? 'text-green-500' : 'text-red-500'}`}>
                {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-sm px-4 py-3 rounded-lg text-base leading-relaxed whitespace-pre-line ${
          message.isUser
            ? 'bg-green-800 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-800 rounded-bl-none'
        }`}
      >
        {message.text}
        
        {/* Render products if available */}
        {message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}