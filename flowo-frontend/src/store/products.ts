import { create } from "zustand";

export type UIFlower = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  flower_type?: string; // keep for detail page / filters
};

type ProductsState = {
  list: UIFlower[];
  loaded: boolean;
  setAll: (list: UIFlower[]) => void;
  findBySlug: (slug: string) => UIFlower | undefined;
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  list: [],
  loaded: false,
  setAll: (list) => set({ list, loaded: true }),
  findBySlug: (slug) => get().list.find((p) => p.slug === slug),
}));
