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
      if (mode === "login") {
        const { user, token } = await apiLogin(username, password);
        login(user, token);
      } else {
        const { user, token } = await apiRegister(username, email, password);
        login(user, token);
      }

      navigate("/"); // після успішного логіну/реєстрації
    } catch {
      setError("Помилка авторизації. Перевір дані або бекенд.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "40px auto",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ marginBottom: "16px" }}>
        {mode === "login" ? "Вхід" : "Реєстрація"}
      </h2>

      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          placeholder="Логін"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ padding: "8px" }}
        />

        {mode === "register" && (
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "8px" }}
          />
        )}

        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "8px" }}
        />

        {error && <div style={{ color: "red", fontSize: "14px" }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            marginTop: "4px",
            cursor: "pointer",
          }}
        >
          {loading
            ? "Обробка..."
            : mode === "login"
            ? "Увійти"
            : "Зареєструватись"}
        </button>
      </form>

      <div style={{ marginTop: "12px", fontSize: "14px" }}>
        {mode === "login" ? (
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => setMode("register")}
          >
            Немає акаунта? Перейти до реєстрації
          </span>
        ) : (
          <span
            style={{ color: "blue", cursor: "pointer" }}
            onClick={() => setMode("login")}
          >
            Вже є акаунт? Перейти до входу
          </span>
        )}
      </div>
    </div>
  );
}
