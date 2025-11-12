import { api } from "./client";
import type { User } from "../types";

export async function register(
  username: string,
  email: string,
  password: string
) {
  const { data } = await api.post<{ user: User; token: string }>(
    "/api/register/",
    { username, email, password }
  );
  return data;
}

export async function login(username: string, password: string) {
  const { data } = await api.post<{ user: User; token: string }>(
    "/api/login/",
    {
      username,
      password,
    }
  );
  return data;
}
