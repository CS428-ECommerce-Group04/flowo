/**
 * Mock product data and tools for chatbot fallback functionality
 */

import type { ApiProduct } from '@/types/product';

// Mock product database with realistic flower shop products
export const mockProducts: ApiProduct[] = [
  {
    id: 1,
    product_id: 1,
    name: "Romantic Red Roses Bouquet",
    description: "A stunning arrangement of 12 premium red roses, perfect for expressing love and passion",
    flower_type: "Rose",
    base_price: 45.99,
    current_price: 45.99,
    status: "Available",
    stock_quantity: 15,
    average_rating: 4.8,
    review_count: 124,
    image_url: "/images/red-roses.jpg"
  },
  {
    id: 2,
    product_id: 2,
    name: "Sunshine Sunflower Bundle",
    description: "Bright and cheerful sunflowers that bring warmth and happiness to any space",
    flower_type: "Sunflower",
    base_price: 35.99,
    current_price: 35.99,
    status: "Available",
    stock_quantity: 20,
    average_rating: 4.9,
    review_count: 89,
    image_url: "/images/sunflowers.jpg"
  },
  {
    id: 3,
    product_id: 3,
    name: "Spring Tulips Collection",
    description: "Fresh tulips in vibrant spring colors - pink, yellow, and purple",
    flower_type: "Tulip",
    base_price: 28.99,
    current_price: 24.99,
    status: "OnSale",
    stock_quantity: 30,
    average_rating: 4.7,
    review_count: 67,
    image_url: "/images/tulips.jpg"
  },
  {
    id: 4,
    product_id: 4,
    name: "Elegant White Lilies",
    description: "Pure white Oriental lilies symbolizing rebirth and serenity",
    flower_type: "Lily",
    base_price: 52.99,
    current_price: 52.99,
    status: "Available",
    stock_quantity: 8,
    average_rating: 4.9,
    review_count: 156,
    image_url: "/images/white-lilies.jpg"
  },
  {
    id: 5,
    product_id: 5,
    name: "Luxury Pink Peonies",
    description: "Exquisite pink peonies, the ultimate symbol of romance and prosperity",
    flower_type: "Peony",
    base_price: 68.99,
    current_price: 68.99,
    status: "Premium",
    stock_quantity: 5,
    average_rating: 5.0,
    review_count: 43,
    image_url: "/images/pink-peonies.jpg"
  },
  {
    id: 6,
    product_id: 6,
    name: "Lavender Dreams Bouquet",
    description: "Fragrant lavender stems known for their calming and soothing properties",
    flower_type: "Lavender",
    base_price: 32.99,
    current_price: 32.99,
    status: "Available",
    stock_quantity: 18,
    average_rating: 4.6,
    review_count: 91,
    image_url: "/images/lavender.jpg"
  },
  {
    id: 7,
    product_id: 7,
    name: "Mixed Wildflower Meadow",
    description: "A natural arrangement of seasonal wildflowers full of color and texture",
    flower_type: "Mixed",
    base_price: 38.99,
    current_price: 38.99,
    status: "Available",
    stock_quantity: 12,
    average_rating: 4.8,
    review_count: 78,
    image_url: "/images/wildflowers.jpg"
  },
  {
    id: 8,
    product_id: 8,
    name: "Classic White Daisies",
    description: "Simple and pure white daisies representing innocence and new beginnings",
    flower_type: "Daisy",
    base_price: 22.99,
    current_price: 22.99,
    status: "Available",
    stock_quantity: 25,
    average_rating: 4.5,
    review_count: 102,
    image_url: "/images/white-daisies.jpg"
  },
  {
    id: 9,
    product_id: 9,
    name: "Gratitude Pink Carnations",
    description: "Delicate pink carnations perfect for showing appreciation and gratitude",
    flower_type: "Carnation",
    base_price: 26.99,
    current_price: 26.99,
    status: "Available",
    stock_quantity: 22,
    average_rating: 4.4,
    review_count: 65,
    image_url: "/images/pink-carnations.jpg"
  },
  {
    id: 10,
    product_id: 10,
    name: "Blue Hydrangea Garden",
    description: "Stunning blue hydrangeas that create a bold statement piece",
    flower_type: "Hydrangea",
    base_price: 48.99,
    current_price: 48.99,
    status: "Available",
    stock_quantity: 10,
    average_rating: 4.9,
    review_count: 88,
    image_url: "/images/blue-hydrangeas.jpg"
  },
  {
    id: 11,
    product_id: 11,
    name: "Birthday Celebration Mix",
    description: "A festive mix of colorful gerberas, roses, and lilies perfect for birthdays",
    flower_type: "Mixed",
    base_price: 54.99,
    current_price: 49.99,
    status: "OnSale",
    stock_quantity: 14,
    average_rating: 4.8,
    review_count: 203,
    image_url: "/images/birthday-mix.jpg"
  },
  {
    id: 12,
    product_id: 12,
    name: "Sympathy White Orchids",
    description: "Elegant white orchids conveying sympathy and eternal love",
    flower_type: "Orchid",
    base_price: 72.99,
    current_price: 72.99,
    status: "Premium",
    stock_quantity: 6,
    average_rating: 4.9,
    review_count: 54,
    image_url: "/images/white-orchids.jpg"
  }
];

// Search products by keyword
export function searchProducts(query: string): ApiProduct[] {
  const searchTerm = query.toLowerCase();
  
  return mockProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.description?.toLowerCase().includes(searchTerm) ||
    product.flower_type?.toLowerCase().includes(searchTerm)
  );
}

// Get products by price range
export function getProductsByPriceRange(minPrice: number, maxPrice: number): ApiProduct[] {
  return mockProducts.filter(product => {
    const price = product.current_price || product.base_price || 0;
    return price >= minPrice && price <= maxPrice;
  });
}

// Get products by occasion
export function getProductsByOccasion(occasion: string): ApiProduct[] {
  const occasionMap: Record<string, number[]> = {
    'birthday': [2, 3, 7, 11],
    'anniversary': [1, 5, 10],
    'romance': [1, 5, 10],
    'sympathy': [4, 12],
    'thank you': [2, 6, 9],
    'congratulations': [2, 3, 7, 11],
    'get well': [2, 6, 8],
    'wedding': [1, 4, 5, 12]
  };

  const productIds = occasionMap[occasion.toLowerCase()] || [];
  return mockProducts.filter(p => productIds.includes(p.id || 0));
}

// Get product by ID
export function getProductById(id: number): ApiProduct | undefined {
  return mockProducts.find(p => p.id === id || p.product_id === id);
}

// Get featured/recommended products
export function getFeaturedProducts(count: number = 3): ApiProduct[] {
  // Return products with highest ratings
  return [...mockProducts]
    .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
    .slice(0, count);
}

// Get products on sale
export function getSaleProducts(): ApiProduct[] {
  return mockProducts.filter(p => 
    p.status === 'OnSale' || 
    (p.base_price && p.current_price && p.current_price < p.base_price)
  );
}

// Mock cart operations
export interface CartOperation {
  productId: number;
  quantity: number;
  action: 'add' | 'remove' | 'update';
}

export function validateCartOperation(operation: CartOperation): {
  success: boolean;
  message: string;
  product?: ApiProduct;
} {
  const product = getProductById(operation.productId);
  
  if (!product) {
    return {
      success: false,
      message: `Product with ID ${operation.productId} not found`
    };
  }

  if (operation.action === 'add' || operation.action === 'update') {
    const stockQty = product.stock_quantity || 0;
    if (operation.quantity > stockQty) {
      return {
        success: false,
        message: `Sorry, only ${stockQty} items available in stock`,
        product
      };
    }
  }

  return {
    success: true,
    message: operation.action === 'add' 
      ? `Added ${operation.quantity} ${product.name} to cart`
      : operation.action === 'remove'
      ? `Removed ${product.name} from cart`
      : `Updated ${product.name} quantity to ${operation.quantity}`,
    product
  };
}