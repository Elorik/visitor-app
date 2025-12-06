import { api } from "./client";
import type { Dish, Review } from "../types";

const BACKEND_URL = "http://localhost:8000";

type ApiCategory = string | { id: number; name: string };

type ApiDish = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  category: ApiCategory;
  photo?: string | null;
  imageUrl?: string | null;
  rating?: string | number | null;
  is_available?: boolean;
  tags?: string | string[] | null; // бек може віддати рядок або масив
};

function mapApiDish(apiDish: ApiDish): Dish {
  let tags: string[] = [];
  if (Array.isArray(apiDish.tags)) {
    tags = apiDish.tags;
  } else if (typeof apiDish.tags === "string") {
    tags = [apiDish.tags];
  }

  let imageUrl = "";
  const rawPhoto = apiDish.photo ?? apiDish.imageUrl ?? "";
  if (rawPhoto) {
    imageUrl = rawPhoto.startsWith("http")
      ? rawPhoto
      : `${BACKEND_URL}${rawPhoto}`;
  }

  return {
    id: apiDish.id,
    name: apiDish.name,
    description: apiDish.description ?? "",
    price: Number(apiDish.price),
    category:
      typeof apiDish.category === "string"
        ? apiDish.category
        : apiDish.category?.name ?? "",
    imageUrl, // ← тут уже повний URL
    rating: Number(apiDish.rating ?? 0),
    is_available: apiDish.is_available ?? true,
    tags,
  };
}

export async function getDishes(params?: {
  category?: string;
  maxPrice?: number;
  ordering?: string;
  tags?: string[];
}): Promise<Dish[]> {
  const { data } = await api.get<ApiDish[]>("/api/dishes/", { params });
  return data.map(mapApiDish);
}

export async function getDish(id: number): Promise<Dish> {
  const { data } = await api.get<ApiDish>(`/api/dishes/${id}/`);
  return mapApiDish(data);
}

// ------- ВІДГУКИ --------

type ApiReview = {
  id: number;
  dish: number;
  user: number;
  rating: number;
  comment: string;
  date: string; // як у Django-моделі
};

export async function getDishReviews(id: number): Promise<Review[]> {
  const { data } = await api.get<ApiReview[]>(`/api/dishes/${id}/reviews/`);
  return data.map((r) => ({
    id: r.id,
    dish: r.dish,
    user: r.user,
    rating: r.rating,
    comment: r.comment,
    created_at: r.date,
  }));
}

// ------- CRUD ДЛЯ АДМІНКИ --------

export async function createDish(dish: Omit<Dish, "id">): Promise<Dish> {
  const payload = {
    name: dish.name,
    description: dish.description,
    price: dish.price,
    category: dish.category, // у бекенді приймається як name, ти вже це обробляєш у perform_create
    is_available: dish.is_available,
    rating: dish.rating,
    // photo/tags/imageUrl тут не шлемо, бо в моделі такого формату немає
  };

  const { data } = await api.post<ApiDish>("/api/dishes/", payload);
  return mapApiDish(data);
}

export async function updateDish(dish: Dish): Promise<Dish> {
  const { id, ...rest } = dish;

  const payload = {
    name: rest.name,
    description: rest.description,
    price: rest.price,
    category: rest.category,
    is_available: rest.is_available,
    rating: rest.rating,
  };

  const { data } = await api.put<ApiDish>(`/api/dishes/${id}/`, payload);
  return mapApiDish(data);
}

export async function deleteDish(id: number): Promise<void> {
  await api.delete(`/api/dishes/${id}/`);
}
