export type ApiEnvelope<T> = { message?: string; data: T };

export type ApiProduct = {
  id?: number;
  product_id?: number;
  name: string;
  description?: string;
  flower_type?: string;
  base_price?: number;
  current_price?: number;       // shown in your screenshot
  status?: string;              // e.g. "NewFlower"
  stock_quantity?: number;
  average_rating?: number;
  review_count?: number;
  image_url?: string;
  primaryImageUrl?: string;
};

export type UIProduct = {
  id: string;
  name: string;
  description: string;
  type: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  tags: string[];
  stock?: number;
  featured?: boolean;
  rating?: { average: number; counts: Record<string, number> };
  slug: string;
};