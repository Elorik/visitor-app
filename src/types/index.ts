export type OrderStatus = "new" | "processing" | "ready";

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  rating: number;
  tags: string[];
  imageUrl?: string;
}

export interface Review {
  id: number;
  dish: number;
  user: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface OrderItem {
  dish: Dish;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  status: OrderStatus;
  total: number;
  created_at: string;
  items: OrderItem[];
}

export interface User {
  id: number;
  username: string;
  email: string;
}

export interface VoiceFilters {
  category: string | null;
  maxPrice: number | null;
  tags: string[];

  query?: string | null;
  ratingFrom?: number | null;
  sort?: "rating_desc" | "price_asc" | "price_desc" | null;

  priceTo?: number | null;
  price?: number | null;
}
