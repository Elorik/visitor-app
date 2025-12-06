// src/api/auth.ts
import { api } from "./client";
import type { User } from "../types";

export interface AuthResponse {
  token: string;
  user: User;
}

// логін: username + password
export async function login(
  username: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/login/", {
    username,
    password,
  });
  return data;
}

// реєстрація: об’єкт з полями
export async function register(payload: {
  username: string;
  password: string;
  email?: string;
}): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/register/", payload);
  return data;
}
