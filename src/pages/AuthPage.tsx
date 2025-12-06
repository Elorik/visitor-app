// src/pages/AuthPage.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin, register as apiRegister } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let resp;

      if (mode === "login") {
        resp = await apiLogin(username, password);
      } else {
        resp = await apiRegister({ username, password, email });
      }

      login(resp.user, resp.token);
      navigate("/");
    } catch {
      setError("Помилка авторизації. Перевір дані або бекенд.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="panel auth-panel">
        <h2 className="page-title">
          {mode === "login" ? "Вхід" : "Реєстрація"}
        </h2>

        <form onSubmit={onSubmit} className="form-vertical">
          <input
            className="input"
            placeholder="Логін"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {mode === "register" && (
            <input
              className="input"
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          <input
            className="input"
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions-center">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading
                ? "Обробка..."
                : mode === "login"
                ? "Увійти"
                : "Зареєструватись"}
            </button>
          </div>
        </form>

        <div className="auth-toggle">
          {mode === "login" ? (
            <button
              type="button"
              className="link-button"
              onClick={() => setMode("register")}
            >
              Немає акаунта? Перейти до реєстрації
            </button>
          ) : (
            <button
              type="button"
              className="link-button"
              onClick={() => setMode("login")}
            >
              Вже є акаунт? Перейти до входу
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
