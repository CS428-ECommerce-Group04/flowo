import ReactMarkdown from 'react-markdown';
import { ShoppingCart } from 'lucide-react';
import type { Message, Product } from './types';
import { resolveProductImage } from '@/data/productImages';
import { useCart } from '@/store/cart';

interface ChatMessageProps {
  message: Message;
}

function ProductCard({ product }: { product: Product }) {
  const cartStore = useCart();
  // Map product ID to actual image file
  const getProductImage = (productId: number, productName: string) => {
    const imageMap: Record<number, string> = {
      1: '/images/red_rose_bouquet.jpg',
      2: '/images/white_lily_arrangement.jpg',
      3: '/images/orchid_delight.jpg',
      4: '/images/carnation_charm.webp',
      5: '/images/daisy_daylight.jpeg',
      6: '/images/hydrangea_hues.jpeg',
      7: '/images/autumn_chrysanthemum.jpeg',
      8: '/images/royal_iris.jpg',
      9: '/images/lavender_breeze.jpg',
      10: '/images/cloudy_gypsophila.jpg'
    };
    
    return imageMap[productId] || product.image_url || resolveProductImage(productName, '');
  };

  const imageUrl = getProductImage(product.id, product.name);

  return (
    <div className="mt-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <div className="flex">
        {/* Product Image */}
        <div className="w-24 h-24 flex-shrink-0">
          <img 
            src={imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/landingflowo.png'; // Fallback image
            }}
          />
        </div>
        
        {/* Product Details */}
        <div className="flex-1 p-3">
          <h4 className="font-bold text-sm text-gray-900">{product.name}</h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{product.description}</p>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-green-600">${product.price.toFixed(2)}</span>
              {product.in_stock !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  product.in_stock 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {product.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
              )}
            </div>
            
            {product.in_stock && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Adding to cart:', product);
                  try {
                    cartStore.add({
                      id: String(product.id),
                      name: product.name,
                      price: product.price,
                      qty: 1,
                      image: getProductImage(product.id, product.name),
                      description: product.description
                    });
                    // Show a brief success message
                    const button = e.currentTarget as HTMLButtonElement;
                    const originalContent = button.innerHTML;
                    button.innerHTML = '<span class="text-xs">✓ Added!</span>';
                    button.disabled = true;
                    setTimeout(() => {
                      button.innerHTML = originalContent;
                      button.disabled = false;
                    }, 1500);
                  } catch (error) {
                    console.error('Error adding to cart:', error);
                  }
                }}
                className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 disabled:bg-green-400"
              >
                <ShoppingCart className="w-3 h-3" />
                <span className="hidden sm:inline">Add to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
      <div
        className={`max-w-[90%] px-5 py-3.5 rounded-2xl text-base leading-relaxed ${
          message.isUser
            ? 'bg-gradient-to-br from-green-600 to-green-700 text-white rounded-br-sm shadow-lg'
            : 'bg-white text-gray-800 rounded-bl-sm shadow-md border border-gray-100'
        }`}
      >
        {/* Render message text with markdown support */}
        {message.isUser ? (
          <div className="text-white">{message.text}</div>
        ) : (
          <ReactMarkdown
            components={{
              // Custom rendering for lists to add better spacing
              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
              // Custom rendering for paragraphs
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              // Custom rendering for strong/bold text
              strong: ({ children }) => <strong className="font-bold text-green-700">{children}</strong>,
              // Custom rendering for code
              code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
        
        {/* Render products if available */}
        {message.products && message.products.length > 0 && (
          <div className="mt-4 space-y-3">
            {message.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        
        {/* Timestamp */}
        <div className={`text-xs mt-2 ${
          message.isUser ? 'text-green-100' : 'text-gray-400'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}

// Add fadeIn animation to tailwind config or as inline style
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
`;
document.head.appendChild(style);