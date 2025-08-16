import { useState, useRef, useEffect } from 'react';
import Button from '@/components/ui/Button';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! Welcome to Bloom & Blossom! 🌸 How can I help you today?",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationContext, setConversationContext] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Expanded flower database with descriptions
  const flowerDatabase = [
    { name: "Red Roses", price: 25, description: "Classic symbol of love and passion, perfect for romantic gestures", occasion: "romantic" },
    { name: "Sunflowers", price: 20, description: "Bright and cheerful blooms that bring sunshine to any room", occasion: "cheerful" },
    { name: "Tulips", price: 18, description: "Elegant spring flowers available in vibrant colors", occasion: "spring" },
    { name: "White Lilies", price: 30, description: "Pure and serene flowers symbolizing peace and rebirth", occasion: "peaceful" },
    { name: "Pink Peonies", price: 40, description: "Luxurious, full-bodied blooms perfect for special celebrations", occasion: "luxury" },
    { name: "Purple Lavender", price: 22, description: "Fragrant flowers known for their calming and relaxing properties", occasion: "calming" },
    { name: "Orange Marigolds", price: 15, description: "Vibrant, long-lasting flowers that symbolize creativity and passion", occasion: "creative" },
    { name: "White Daisies", price: 16, description: "Simple, pure flowers representing innocence and new beginnings", occasion: "innocent" },
    { name: "Pink Carnations", price: 19, description: "Delicate, ruffled petals perfect for expressing gratitude", occasion: "gratitude" },
    { name: "Blue Hydrangeas", price: 35, description: "Full, rounded blooms that represent heartfelt emotions", occasion: "emotional" },
    { name: "Yellow Chrysanthemums", price: 24, description: "Cheerful autumn flowers symbolizing joy and optimism", occasion: "joyful" },
    { name: "Red Gerbera Daisies", price: 21, description: "Bold, colorful flowers that radiate happiness and energy", occasion: "energetic" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getRandomFlowers = (count: number = 3) => {
    const shuffled = [...flowerDatabase].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getFlowersByOccasion = (occasion: string) => {
    return flowerDatabase.filter(flower => 
      flower.occasion.includes(occasion) || 
      flower.description.toLowerCase().includes(occasion)
    );
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    setConversationContext(lowerMessage);

    // Greetings and pleasantries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      const greetings = [
        "Hello there! 🌻 I'm so glad you're here! What beautiful flowers can I help you find today?",
        "Hi! 🌺 Welcome to our garden of possibilities! Are you looking for something special?",
        "Hey! 🌸 Great to see you! I'd love to help you discover the perfect flowers!"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Random flower suggestions
    if (lowerMessage.includes('random') || lowerMessage.includes('surprise') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
      const randomFlowers = getRandomFlowers(3);
      let response = "Here are some beautiful flowers I'd love to recommend today:\n\n";

      randomFlowers.forEach((flower, index) => {
        response += `🌸 **${flower.name}** ($${flower.price})\n${flower.description}\n\n`;
      });

      response += "Would you like to know more about any of these, or shall I suggest something else?";
      return response;
    }

    // Occasion-based suggestions
    if (lowerMessage.includes('birthday') || lowerMessage.includes('celebration')) {
      const flowers = getRandomFlowers(2);
      return `For birthdays, I love suggesting vibrant, joyful flowers! 🎉\n\n🌻 **${flowers[0].name}** ($${flowers[0].price}) - ${flowers[0].description}\n\n🌺 **${flowers[1].name}** ($${flowers[1].price}) - ${flowers[1].description}\n\nBoth would make the birthday person smile! Which catches your eye?`;
    }

    if (lowerMessage.includes('anniversary') || lowerMessage.includes('romantic') || lowerMessage.includes('love')) {
      const romanticFlowers = getFlowersByOccasion('romantic');
      if (romanticFlowers.length > 0) {
        const flower = romanticFlowers[0];
        return `For romance and anniversaries, nothing beats our ${flower.name}! 💕\n\n${flower.description}\n\nAt $${flower.price}, they're perfect for showing someone how much you care. Would you like me to tell you about our romantic bouquet arrangements?`;
      }
    }

    if (lowerMessage.includes('funeral') || lowerMessage.includes('sympathy') || lowerMessage.includes('condolence')) {
      return "For sympathy arrangements, we offer peaceful white lilies and elegant chrysanthemums. 🕊️\n\nThese flowers convey respect and remembrance beautifully. We can create custom sympathy arrangements starting at $35. Would you like me to connect you with our specialist for a personal consultation?";
    }

    if (lowerMessage.includes('wedding') || lowerMessage.includes('bridal')) {
      const luxuryFlowers = getFlowersByOccasion('luxury');
      return `Congratulations on your upcoming wedding! 💒✨\n\nFor weddings, I recommend our ${luxuryFlowers[0]?.name || 'Pink Peonies'} - they're absolutely stunning for bridal arrangements.\n\nWe offer complete wedding packages including bridal bouquets, centerpieces, and ceremony decorations. Call us at (555) 123-4567 for a personalized consultation!`;
    }

    // Seasonal recommendations
    if (lowerMessage.includes('spring') || lowerMessage.includes('seasonal')) {
      const springFlowers = getFlowersByOccasion('spring');
      return `Spring is such a beautiful time for flowers! 🌷\n\nRight now, our ${springFlowers[0]?.name || 'Tulips'} are absolutely gorgeous - ${springFlowers[0]?.description || 'perfect for celebrating the season'}.\n\nWe also have fresh daffodils and cherry blossoms that just arrived! What spring feeling are you hoping to capture?`;
    }

    // Care and maintenance
    if (lowerMessage.includes('care') || lowerMessage.includes('maintain') || lowerMessage.includes('last') || lowerMessage.includes('keep fresh')) {
      return "Great question about flower care! 🌿 Here are my top tips:\n\n• Cut stems at an angle under running water\n• Change water every 2-3 days\n• Remove wilted leaves and flowers\n• Keep away from direct sunlight and heat\n• Add flower food to extend life\n\nOur flowers typically last 7-10 days with proper care! Need specific care tips for a particular flower?";
    }

    // Color preferences
    if (lowerMessage.includes('red') || lowerMessage.includes('pink') || lowerMessage.includes('white') || lowerMessage.includes('yellow') || lowerMessage.includes('purple') || lowerMessage.includes('blue')) {
      const colorMatch = lowerMessage.match(/(red|pink|white|yellow|purple|blue|orange)/i);
      if (colorMatch) {
        const color = colorMatch[0];
        const colorFlowers = flowerDatabase.filter(flower => 
          flower.name.toLowerCase().includes(color.toLowerCase())
        );

        if (colorFlowers.length > 0) {
          const flower = colorFlowers[0];
          return `${color.charAt(0).toUpperCase() + color.slice(1)} flowers are stunning! 🎨\n\nOur **${flower.name}** ($${flower.price}) are particularly beautiful - ${flower.description}\n\nWould you like to see what other ${color} options we have available?`;
        }
      }
    }

    // Pricing inquiries
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') || lowerMessage.includes('expensive') || lowerMessage.includes('cheap') || lowerMessage.includes('budget')) {
      return "Our flower prices range from $15-$40, perfect for any budget! 💰\n\n• Budget-friendly: Marigolds ($15), Daisies ($16)\n• Mid-range: Tulips ($18), Sunflowers ($20)\n• Premium: Roses ($25), Lilies ($30), Peonies ($40)\n\nAll our flowers come with a freshness guarantee! What's your budget range today?";
    }

    // Delivery information
    if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping') || lowerMessage.includes('send')) {
      return "We offer fantastic delivery options! 🚚\n\n• Same-day delivery within the city (2-4 hours)\n• Next-day delivery to surrounding areas\n• Express delivery for urgent orders\n• Free delivery on orders over $50\n\nWhere would you like your beautiful flowers delivered?";
    }

    // Store information
    if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('closed') || lowerMessage.includes('when')) {
      return "We're here to help you find beautiful flowers! 🕐\n\n**Store Hours:**\n• Monday-Saturday: 9AM-7PM\n• Sunday: 10AM-5PM\n• Online ordering: 24/7\n\nYou can also call us anytime at (555) 123-4567. When would you like to visit or place an order?";
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where') || lowerMessage.includes('visit')) {
      return "Come visit our beautiful flower shop! 📍\n\n**Bloom & Blossom**\n123 Garden Street\nFlower District, FD 12345\n\nWe're right in the heart of the flower district - you can't miss our colorful storefront! There's plenty of parking, and we love welcoming visitors to see our fresh flowers in person.";
    }

    // Specific flower inquiries
    if (lowerMessage.includes('roses') || lowerMessage.includes('rose')) {
      return "Roses are our specialty! 🌹 Our red roses ($25) are incredibly popular for romantic occasions.\n\nWe also carry:\n• Pink roses for gratitude and appreciation\n• White roses for new beginnings\n• Yellow roses for friendship\n\nEach bouquet comes with baby's breath and greenery. Would you like to add roses to your order?";
    }

    if (lowerMessage.includes('sunflower')) {
      return "Sunflowers are absolutely wonderful! 🌻 At $20, they're perfect for brightening anyone's day.\n\nThese cheerful giants symbolize loyalty, adoration, and positivity. They're also great for people with allergies since they have minimal pollen. Would you like a single stem or a beautiful bouquet arrangement?";
    }

    // Compliments and positive feedback
    if (lowerMessage.includes('beautiful') || lowerMessage.includes('gorgeous') || lowerMessage.includes('lovely') || lowerMessage.includes('amazing')) {
      return "Thank you so much! 😊 We put so much love into selecting and caring for each flower. There's nothing quite like the joy that fresh, beautiful flowers can bring to someone's day. Is there a special someone you'd like to surprise with flowers?";
    }

    // Gratitude responses
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks') || lowerMessage.includes('appreciate')) {
      const thankYouResponses = [
        "You're so welcome! 🌸 It's my pleasure to help you find the perfect flowers. Is there anything else I can assist you with?",
        "My pleasure! 😊 I love helping people discover beautiful flowers. Feel free to ask me anything else!",
        "You're very welcome! 🌺 That's what I'm here for - making your flower shopping experience delightful!"
      ];
      return thankYouResponses[Math.floor(Math.random() * thankYouResponses.length)];
    }

    // Farewell responses
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you') || lowerMessage.includes('later')) {
      return "Thank you for visiting Bloom & Blossom! 🌻 Have a wonderful day, and remember - life is more beautiful with flowers! Feel free to come back anytime you need floral inspiration! 💐";
    }

    // Confused or unclear responses
    if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('help') || lowerMessage.includes('confused')) {
      return "I'm here to help make your flower shopping easy and enjoyable! 🌸\n\nI can help you with:\n• Flower recommendations and suggestions\n• Pricing and delivery information\n• Care tips and advice\n• Occasion-specific arrangements\n• Store hours and location\n\nWhat would you like to know more about?";
    }

    // Default responses with more personality
    const defaultResponses = [
      "That's interesting! 🌼 I'd love to help you find the perfect flowers. You can browse our collection on the Shop page, or tell me what kind of occasion or feeling you're shopping for!",
      "I'm here to help with all things floral! 🌺 Whether you need recommendations, have questions about care, or want to know about delivery - just ask! What's on your mind?",
      "Every flower has a story to tell! 🌸 I'd be happy to help you find the perfect blooms. What brings you to our garden today?",
      "Flowers have such a wonderful way of expressing what words sometimes can't! 💐 How can I help you find the perfect arrangement today?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate more realistic typing delay based on response length
    const response = generateBotResponse(currentInput);
    const typingDelay = Math.min(3000, Math.max(1000, response.length * 20));

    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, typingDelay);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[32rem] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-green-800 text-white p-5 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-lg">
            🌸
          </div>
          <div>
            <h3 className="font-semibold text-base">Bloom & Blossom</h3>
            <p className="text-sm text-green-100">Online now</p>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-sm px-4 py-3 rounded-lg text-base leading-relaxed whitespace-pre-line ${
                message.isUser
                  ? 'bg-green-800 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg rounded-bl-none text-base">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent text-base"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-3 bg-green-800 hover:bg-green-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
