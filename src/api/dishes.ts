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

// базові CRUD операції для адміністрування

export async function createDish(dish: Omit<Dish, "id">): Promise<Dish> {
    // Тут має бути запит: return client.post('/dishes', dish);
    console.log("Creating dish:", dish);
    return { ...dish, id: Date.now() }; // Фейковий ID
}

export async function updateDish(dish: Dish): Promise<Dish> {
    // Тут має бути запит: return client.put(`/dishes/${dish.id}`, dish);
    console.log("Updating dish:", dish);
    return dish;
}

export async function deleteDish(id: number): Promise<void> {
    // Тут має бути запит: return client.delete(`/dishes/${id}`);
    console.log("Deleting dish with id:", id);
}
