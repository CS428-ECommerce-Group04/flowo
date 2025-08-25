/**
 * Chat tools for product search and cart operations
 * These tools return product IDs that the chatbot will use to fetch real products from the backend
 */

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  message?: string;
}

// Tool definitions - simplified for TypeScript compatibility
export const AVAILABLE_TOOLS = {
  searchProducts: {
    name: 'searchProducts',
    description: 'Search for products by keyword, type, or occasion',
    parameters: ['query', 'category', 'priceRange']
  },
  addToCart: {
    name: 'addToCart',
    description: 'Add a product to the shopping cart',
    parameters: ['productId', 'quantity']
  },
  getProductDetails: {
    name: 'getProductDetails',
    description: 'Get detailed information about a specific product',
    parameters: ['productId']
  },
  getRecommendations: {
    name: 'getRecommendations',
    description: 'Get product recommendations based on occasion or preference',
    parameters: ['occasion', 'priceRange', 'count']
  }
};

/**
 * Execute a tool call and return product IDs
 * In production, these would call actual backend endpoints
 * For now, they return mock product IDs that exist in the backend
 */
export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  switch (toolCall.tool) {
    case 'searchProducts':
      return executeSearchProducts(toolCall.parameters);
    
    case 'addToCart':
      return executeAddToCart(toolCall.parameters);
    
    case 'getProductDetails':
      return executeGetProductDetails(toolCall.parameters);
    
    case 'getRecommendations':
      return executeGetRecommendations(toolCall.parameters);
    
    default:
      return {
        success: false,
        message: `Unknown tool: ${toolCall.tool}`
      };
  }
}

/**
 * Search products and return matching product IDs
 * Returns real product IDs that exist in the backend database
 */
function executeSearchProducts(params: any): ToolResult {
  const { query, category, priceRange } = params;
  const searchTerm = query?.toLowerCase() || '';
  
  // Map search terms to actual product IDs in the backend
  // Based on actual products in database (IDs 1-10)
  const productMapping: Record<string, number[]> = {
    'rose': [1],
    'roses': [1],
    'red': [1],
    'lily': [2],
    'lilies': [2],
    'white': [2, 10],
    'orchid': [3],
    'orchids': [3],
    'carnation': [4],
    'carnations': [4],
    'daisy': [5],
    'daisies': [5],
    'hydrangea': [6],
    'chrysanthemum': [7],
    'autumn': [7],
    'iris': [8],
    'royal': [8],
    'lavender': [9],
    'purple': [8, 9],
    'gypsophila': [10],
    'baby breath': [10],
    'cloudy': [10],
    'birthday': [1, 5, 7],
    'anniversary': [1, 3, 8],
    'romance': [1, 3, 9],
    'romantic': [1, 3, 9],
    'sympathy': [2, 10],
    'wedding': [1, 2, 3, 10],
    'thank you': [4, 5, 6],
    'cheap': [4, 5, 7],
    'expensive': [3, 6, 8],
    'premium': [3, 6, 8],
    'budget': [4, 5, 7],
    'sale': [5, 7, 9],
    'discount': [5, 7, 9]
  };

  // Find matching product IDs
  let matchingIds: number[] = [];
  
  // Check each word in the search query
  const words = searchTerm.split(' ');
  for (const word of words) {
    if (productMapping[word]) {
      matchingIds = matchingIds.length > 0 
        ? matchingIds.filter(id => productMapping[word].includes(id))
        : productMapping[word];
    }
  }

  // If no specific matches, return some default products
  if (matchingIds.length === 0 && searchTerm) {
    // Return first 3 products as default search results
    matchingIds = [1, 2, 3];
  }

  // Apply price filter if provided
  if (priceRange) {
    // For demo purposes, categorize products by price ranges (using IDs 1-10)
    const budgetProducts = [4, 5, 7]; // Under $30
    const midRangeProducts = [1, 2, 9, 10]; // $30-60
    const premiumProducts = [3, 6, 8]; // Over $60
    
    if (priceRange.max <= 30) {
      matchingIds = matchingIds.filter(id => budgetProducts.includes(id));
    } else if (priceRange.min >= 60) {
      matchingIds = matchingIds.filter(id => premiumProducts.includes(id));
    }
  }

  return {
    success: true,
    data: {
      productIds: matchingIds.slice(0, 5), // Return max 5 products
      totalFound: matchingIds.length
    },
    message: `Found ${matchingIds.length} products matching your search`
  };
}

/**
 * Add product to cart
 * Returns the product ID that was added
 */
function executeAddToCart(params: any): ToolResult {
  const { productId, quantity = 1 } = params;
  
  // Validate product ID (products 1-10 exist in backend)
  if (!productId || productId < 1 || productId > 10) {
    return {
      success: false,
      message: 'Invalid product ID. Please use a product ID between 1 and 10.'
    };
  }

  // Validate quantity
  if (quantity < 1 || quantity > 10) {
    return {
      success: false,
      message: 'Quantity must be between 1 and 10'
    };
  }

  return {
    success: true,
    data: {
      productId,
      quantity,
      action: 'added'
    },
    message: `Added ${quantity} item(s) to cart (Product ID: ${productId})`
  };
}

/**
 * Get product details
 * Returns the product ID for fetching full details
 */
function executeGetProductDetails(params: any): ToolResult {
  const { productId } = params;
  
  if (!productId || productId < 1 || productId > 10) {
    return {
      success: false,
      message: 'Product not found. Please use a product ID between 1 and 10.'
    };
  }

  return {
    success: true,
    data: {
      productId
    },
    message: `Fetching details for product ${productId}`
  };
}

/**
 * Get product recommendations
 * Returns recommended product IDs based on occasion or preferences
 */
function executeGetRecommendations(params: any): ToolResult {
  const { occasion, priceRange, count = 3 } = params;
  
  // Recommendation mappings to real product IDs (1-10)
  const occasionRecommendations: Record<string, number[]> = {
    'birthday': [1, 5, 7], // Red Rose, Daisy, Chrysanthemum
    'anniversary': [1, 3, 8], // Red Rose, Orchid, Royal Iris
    'romance': [1, 3, 9], // Red Rose, Orchid, Lavender
    'sympathy': [2, 10], // White Lily, Gypsophila
    'wedding': [1, 2, 3, 10], // Rose, Lily, Orchid, Gypsophila
    'congratulations': [3, 5, 6], // Orchid, Daisy, Hydrangea
    'thank you': [4, 5, 6], // Carnation, Daisy, Hydrangea
    'get well': [5, 6, 9], // Daisy, Hydrangea, Lavender
    'new baby': [4, 5, 10], // Carnation, Daisy, Gypsophila
    'graduation': [1, 3, 8] // Rose, Orchid, Royal Iris
  };

  let recommendedIds: number[];
  
  if (occasion && occasionRecommendations[occasion.toLowerCase()]) {
    recommendedIds = occasionRecommendations[occasion.toLowerCase()];
  } else {
    // Default recommendations - bestsellers
    recommendedIds = [1, 2, 3, 4, 5];
  }

  // Apply price filter
  if (priceRange) {
    const budgetProducts = [4, 5, 7]; // Budget options
    const premiumProducts = [3, 6, 8]; // Premium options
    
    if (priceRange.max <= 30) {
      recommendedIds = recommendedIds.filter(id => budgetProducts.includes(id));
    } else if (priceRange.min >= 60) {
      recommendedIds = recommendedIds.filter(id => premiumProducts.includes(id));
    }
  }

  // If no products match filters, provide defaults
  if (recommendedIds.length === 0) {
    recommendedIds = [1, 2, 3];
  }

  return {
    success: true,
    data: {
      productIds: recommendedIds.slice(0, count),
      occasion: occasion || 'general'
    },
    message: `Here are ${Math.min(count, recommendedIds.length)} recommended products`
  };
}

/**
 * Parse user message to detect tool calls
 */
export function detectToolCall(message: string): ToolCall | null {
  const lowerMessage = message.toLowerCase();
  
  // Detect search intent
  if (lowerMessage.includes('search') || 
      lowerMessage.includes('find') || 
      lowerMessage.includes('show me') ||
      lowerMessage.includes('looking for') ||
      lowerMessage.includes('do you have')) {
    
    // Extract search terms
    const searchPatterns = [
      /(?:search|find|show me|looking for|do you have)\s+(.+?)(?:\s+flowers?)?$/i,
      /(?:flowers?\s+for\s+)(.+)$/i,
      /(?:need|want)\s+(.+?)(?:\s+flowers?)?$/i
    ];
    
    for (const pattern of searchPatterns) {
      const match = message.match(pattern);
      if (match) {
        return {
          tool: 'searchProducts',
          parameters: { query: match[1].trim() }
        };
      }
    }
    
    // Generic search
    return {
      tool: 'searchProducts',
      parameters: { query: message }
    };
  }
  
  // Detect add to cart intent
  if (lowerMessage.includes('add to cart') || 
      lowerMessage.includes('buy') ||
      lowerMessage.includes('order')) {
    
    // Extract product ID if mentioned
    const idMatch = message.match(/(?:product\s+)?(?:id\s+)?(\d+)/i);
    if (idMatch) {
      const quantityMatch = message.match(/(\d+)\s+(?:items?|pieces?|bouquets?)/i);
      return {
        tool: 'addToCart',
        parameters: {
          productId: parseInt(idMatch[1]),
          quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1
        }
      };
    }
  }
  
  // Detect recommendation intent
  if (lowerMessage.includes('recommend') || 
      lowerMessage.includes('suggest') ||
      lowerMessage.includes('what should i') ||
      lowerMessage.includes('help me choose')) {
    
    // Check for occasion
    const occasions = ['birthday', 'anniversary', 'romance', 'sympathy', 'wedding', 
                      'congratulations', 'thank you', 'get well'];
    
    for (const occasion of occasions) {
      if (lowerMessage.includes(occasion)) {
        return {
          tool: 'getRecommendations',
          parameters: { occasion, count: 3 }
        };
      }
    }
    
    // Generic recommendation
    return {
      tool: 'getRecommendations',
      parameters: { count: 3 }
    };
  }
  
  // Detect product details intent
  if (lowerMessage.includes('tell me about') || 
      lowerMessage.includes('details') ||
      lowerMessage.includes('more about')) {
    
    const idMatch = message.match(/(?:product\s+)?(?:id\s+)?(\d+)/i);
    if (idMatch) {
      return {
        tool: 'getProductDetails',
        parameters: { productId: parseInt(idMatch[1]) }
      };
    }
  }
  
  return null;
}