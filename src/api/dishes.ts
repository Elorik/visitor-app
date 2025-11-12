import { api } from "./client";
import type { Dish, Review } from "../types";

export async function getDishes(params?: {
  category?: string;
  maxPrice?: number;
  ordering?: string;
  tags?: string[];
}) {
  const { data } = await api.get<Dish[]>("/api/dishes/", { params });
  return data;
}

export async function getDish(id: number) {
  const { data } = await api.get<Dish>(`/api/dishes/${id}/`);
  return data;
}

export async function getDishReviews(id: number) {
  const { data } = await api.get<Review[]>(`/api/dishes/${id}/reviews/`);
  return data;
}
