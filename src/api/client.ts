import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000",
  // креденшали не юзаємо, тільки токен в заголовку
  withCredentials: false,
});

// глобальний інтерсептор: перед кожним запитом дістаємо токен
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("token");
  if (raw && raw !== "null" && raw !== "undefined") {
    config.headers = config.headers ?? {};
    config.headers["Authorization"] = `Token ${raw}`;
  }
  return config;
});

// залишаємо, якщо десь викликаєш явно
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Token ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}
