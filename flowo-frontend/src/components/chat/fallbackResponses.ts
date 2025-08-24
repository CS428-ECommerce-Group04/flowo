/**
 * Fallback responses for when the AI service is unavailable
 */

import type { FlowerData } from './types';

export const flowerDatabase: FlowerData[] = [
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

export const getRandomFlowers = (count: number = 3): FlowerData[] => {
  const shuffled = [...flowerDatabase].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getFlowersByOccasion = (occasion: string): FlowerData[] => {
  return flowerDatabase.filter(flower => 
    flower.occasion.includes(occasion) || 
    flower.description.toLowerCase().includes(occasion)
  );
};

export const generateFallbackResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  // Greetings
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      "Hello there! 🌻 I'm so glad you're here! What beautiful flowers can I help you find today?",
      "Hi! 🌺 Welcome to our garden of possibilities! Are you looking for something special?",
      "Hey! 🌸 Great to see you! I'd love to help you discover the perfect flowers!"
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  // Random suggestions
  if (lowerMessage.includes('random') || lowerMessage.includes('surprise') || lowerMessage.includes('suggest') || lowerMessage.includes('recommend')) {
    const randomFlowers = getRandomFlowers(3);
    let response = "Here are some beautiful flowers I'd love to recommend today:\n\n";
    
    randomFlowers.forEach((flower) => {
      response += `🌸 **${flower.name}** ($${flower.price})\n${flower.description}\n\n`;
    });
    
    response += "Would you like to know more about any of these?";
    return response;
  }

  // Birthday
  if (lowerMessage.includes('birthday') || lowerMessage.includes('celebration')) {
    const flowers = getRandomFlowers(2);
    return `For birthdays, I love suggesting vibrant, joyful flowers! 🎉\n\n🌻 **${flowers[0].name}** ($${flowers[0].price}) - ${flowers[0].description}\n\n🌺 **${flowers[1].name}** ($${flowers[1].price}) - ${flowers[1].description}\n\nBoth would make the birthday person smile!`;
  }

  // Romance
  if (lowerMessage.includes('anniversary') || lowerMessage.includes('romantic') || lowerMessage.includes('love')) {
    const romanticFlowers = getFlowersByOccasion('romantic');
    if (romanticFlowers.length > 0) {
      const flower = romanticFlowers[0];
      return `For romance and anniversaries, nothing beats our ${flower.name}! 💕\n\n${flower.description}\n\nAt $${flower.price}, they're perfect for showing someone how much you care.`;
    }
  }

  // Sympathy
  if (lowerMessage.includes('funeral') || lowerMessage.includes('sympathy') || lowerMessage.includes('condolence')) {
    return "For sympathy arrangements, we offer peaceful white lilies and elegant chrysanthemums. 🕊️\n\nThese flowers convey respect and remembrance beautifully. We can create custom sympathy arrangements starting at $35.";
  }

  // Wedding
  if (lowerMessage.includes('wedding') || lowerMessage.includes('bridal')) {
    return `Congratulations on your upcoming wedding! 💒✨\n\nFor weddings, I recommend our Pink Peonies - they're absolutely stunning for bridal arrangements.\n\nWe offer complete wedding packages. Call us at (555) 123-4567 for a consultation!`;
  }

  // Care tips
  if (lowerMessage.includes('care') || lowerMessage.includes('maintain') || lowerMessage.includes('last') || lowerMessage.includes('keep fresh')) {
    return "Great question about flower care! 🌿 Here are my top tips:\n\n• Cut stems at an angle under running water\n• Change water every 2-3 days\n• Remove wilted leaves and flowers\n• Keep away from direct sunlight and heat\n• Add flower food to extend life\n\nOur flowers typically last 7-10 days with proper care!";
  }

  // Pricing
  if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much') || lowerMessage.includes('budget')) {
    return "Our flower prices range from $15-$40, perfect for any budget! 💰\n\n• Budget-friendly: Marigolds ($15), Daisies ($16)\n• Mid-range: Tulips ($18), Sunflowers ($20)\n• Premium: Roses ($25), Lilies ($30), Peonies ($40)\n\nAll flowers come with a freshness guarantee!";
  }

  // Delivery
  if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping') || lowerMessage.includes('send')) {
    return "We offer fantastic delivery options! 🚚\n\n• Same-day delivery within the city (2-4 hours)\n• Next-day delivery to surrounding areas\n• Express delivery for urgent orders\n• Free delivery on orders over $50\n\nWhere would you like your flowers delivered?";
  }

  // Store hours
  if (lowerMessage.includes('hours') || lowerMessage.includes('open') || lowerMessage.includes('closed')) {
    return "We're here to help you find beautiful flowers! 🕐\n\n**Store Hours:**\n• Monday-Saturday: 9AM-7PM\n• Sunday: 10AM-5PM\n• Online ordering: 24/7\n\nCall us at (555) 123-4567 anytime!";
  }

  // Location
  if (lowerMessage.includes('location') || lowerMessage.includes('address') || lowerMessage.includes('where')) {
    return "Come visit our beautiful flower shop! 📍\n\n**Bloom & Blossom**\n123 Garden Street\nFlower District, FD 12345\n\nWe're in the heart of the flower district with plenty of parking!";
  }

  // Specific flowers
  if (lowerMessage.includes('roses') || lowerMessage.includes('rose')) {
    return "Roses are our specialty! 🌹 Our red roses ($25) are incredibly popular.\n\nWe also carry:\n• Pink roses for gratitude\n• White roses for new beginnings\n• Yellow roses for friendship\n\nWould you like to add roses to your order?";
  }

  if (lowerMessage.includes('sunflower')) {
    return "Sunflowers are absolutely wonderful! 🌻 At $20, they're perfect for brightening anyone's day.\n\nThese cheerful giants symbolize loyalty and positivity. Great for people with allergies too!";
  }

  // Thank you
  if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
    const thankYouResponses = [
      "You're so welcome! 🌸 It's my pleasure to help you find the perfect flowers.",
      "My pleasure! 😊 I love helping people discover beautiful flowers.",
      "You're very welcome! 🌺 That's what I'm here for!"
    ];
    return thankYouResponses[Math.floor(Math.random() * thankYouResponses.length)];
  }

  // Goodbye
  if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
    return "Thank you for visiting Bloom & Blossom! 🌻 Have a wonderful day, and remember - life is more beautiful with flowers! 💐";
  }

  // Help
  if (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('help')) {
    return "I'm here to help! 🌸\n\nI can assist with:\n• Flower recommendations\n• Pricing and delivery info\n• Care tips and advice\n• Occasion-specific arrangements\n• Store hours and location\n\nWhat would you like to know?";
  }

  // Default responses
  const defaultResponses = [
    "That's interesting! 🌼 I'd love to help you find the perfect flowers. Tell me what kind of occasion or feeling you're shopping for!",
    "I'm here to help with all things floral! 🌺 Whether you need recommendations or have questions - just ask!",
    "Every flower has a story to tell! 🌸 How can I help you find the perfect blooms today?",
    "Flowers have a wonderful way of expressing emotions! 💐 How can I help you today?"
  ];
  
  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
};