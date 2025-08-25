import { create } from "zustand";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  image?: string;
  description?: string;
  tags?: string[];
};

// API response type
type ApiCartItem = {
  description?: string;
  effective_price?: number;
  name: string;
  price: number;
  product_id: string;
  quantity: number;
  total_price: number;
};

type CartState = {
  items: CartItem[];
  loading: boolean;
  error: string | null;

  // actions
  fetchCart: () => Promise<void>;
  add: (productId: number, quantity?: number) => Promise<void>;
  increment: (id: number) => Promise<void>;
  decrement: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  updateQuantity: (id: number, quantity: number) => Promise<void>;
  clear: () => void;
  clearError: () => void;

  // selectors
  itemCount: () => number;
  subtotal: () => number;
};

const API_BASE = "http://localhost:8081/api/v1";

// Helper function to map API response to CartItem
function mapApiItemToCartItem(apiItem: ApiCartItem): CartItem {
  return {
    id: parseInt(apiItem.product_id),
    name: apiItem.name,
    price: apiItem.effective_price ?? apiItem.price,
    qty: apiItem.quantity,
    description: apiItem.description,
    // Placeholder values since API doesn't provide these
    image: undefined,
    tags: undefined,
  };
}

// Helper function to make authenticated API requests
async function makeApiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for authentication
  });

  if (!response.ok) {
    let errorMessage = 'Request failed';

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If response is not JSON, use status-based messages
      switch (response.status) {
        case 400:
          errorMessage = 'Invalid request. Please check your input.';
          break;
        case 401:
          errorMessage = 'Authentication failed. Please log in again.';
          break;
        case 404:
          errorMessage = 'Product not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          errorMessage = `Request failed (${response.status})`;
      }
    }

    throw new Error(errorMessage);
  }

  // Handle empty responses
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const useCart = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const apiItems: ApiCartItem[] = await makeApiRequest('/cart/');
      const items = apiItems.map(mapApiItemToCartItem);
      set({ items, loading: false });
    } catch (error: any) {
      console.error('Failed to fetch cart:', error);
      set({ error: error.message, loading: false });
    }
  },

  add: async (productId: number, quantity = 1) => {
    set({ loading: true, error: null });
    try {
      await makeApiRequest('/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
        }),
      });

      // Refresh cart after successful add
      await get().fetchCart();
    } catch (error: any) {
      console.error('Failed to add item to cart:', error);
      set({ error: error.message, loading: false });
    }
  },

  increment: async (id: number) => {
    const currentItem = get().items.find(item => item.id === id);
    if (!currentItem) {
      set({ error: 'Item not found in cart' });
      return;
    }

    await get().updateQuantity(id, currentItem.qty + 1);
  },

  decrement: async (id: number) => {
    const currentItem = get().items.find(item => item.id === id);
    if (!currentItem) {
      set({ error: 'Item not found in cart' });
      return;
    }

    if (currentItem.qty <= 1) {
      await get().remove(id);
    } else {
      await get().updateQuantity(id, currentItem.qty - 1);
    }
  },

  updateQuantity: async (id: number, quantity: number) => {
    if (quantity <= 0) {
      await get().remove(id);
      return;
    }

    set({ loading: true, error: null });
    try {
      await makeApiRequest('/cart/update', {
        method: 'PUT',
        body: JSON.stringify({
          product_id: id,
          quantity: quantity,
        }),
      });

      // Refresh cart after successful update
      await get().fetchCart();
    } catch (error: any) {
      console.error('Failed to update cart item:', error);
      set({ error: error.message, loading: false });
    }
  },

  remove: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await makeApiRequest('/cart/remove', {
        method: 'DELETE',
        body: JSON.stringify({
          product_id: id,
        }),
      });

      // Refresh cart after successful removal
      await get().fetchCart();
    } catch (error: any) {
      console.error('Failed to remove item from cart:', error);
      set({ error: error.message, loading: false });
    }
  },

  clear: () => set({ items: [], error: null }),

  clearError: () => set({ error: null }),

  itemCount: () => get().items.reduce((n, x) => n + x.qty, 0),
  subtotal: () => get().items.reduce((n, x) => n + x.price * x.qty, 0),
}));
