import { api } from "./client";
import type { Review } from "../types";

export async function createReview(
  dishId: number,
  rating: number,
  comment: string
) {
  const { data } = await api.post<Review>("/api/reviews/", {
    dish: dishId,
    rating,
    comment,
  });
  return data;
}
