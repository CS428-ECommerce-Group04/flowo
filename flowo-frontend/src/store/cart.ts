import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  description?: string;
  tags?: string[];
};

type CartState = {
  items: CartItem[];

  // actions
  add: (item: CartItem) => void;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;

  // selectors
  itemCount: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],

  add: (item) =>
    set((s) => {
      const i = s.items.findIndex((x) => x.id === item.id);
      if (i >= 0) {
        const next = [...s.items];
        next[i] = { ...next[i], qty: next[i].qty + item.qty };
        return { items: next };
      }
      return { items: [...s.items, item] };
    }),

  increment: (id) =>
    set((s) => ({
      items: s.items.map((x) => (x.id === id ? { ...x, qty: x.qty + 1 } : x)),
    })),

  decrement: (id) =>
    set((s) => ({
      items: s.items
        .map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty - 1) } : x))
        .filter((x) => x.qty > 0),
    })),

  remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),

  clear: () => set({ items: [] }),

  itemCount: () => get().items.reduce((n, x) => n + x.qty, 0),
  subtotal: () => get().items.reduce((n, x) => n + x.price * x.qty, 0),
}));
