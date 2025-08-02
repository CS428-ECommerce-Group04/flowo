export type RatingCounts = Partial<Record<"5" | "4" | "3" | "2" | "1", number>>;

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  description: string;
  tags: string[];
  featured?: boolean;

  // Optional detail fields (use any you need)
  compareAtPrice?: number;   // old price for strikethrough + discount
  stock?: number;            // e.g., 12
  type?: string;             // e.g., "Peonies"
  condition?: string;        // e.g., "Fresh & New"
  care?: string;             // e.g., "Cool water daily"
  rating?: {
    average?: number;        // e.g., 4.7
    counts?: RatingCounts;   // e.g., {"5": 2, "4": 1, "3": 0}
  };
};