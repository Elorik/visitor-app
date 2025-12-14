// FILE: src/voice/VoiceOrchestrator.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { subscribeVoiceActions, type VoiceAction } from "./VoiceIntegration";
import { VoiceAssistant } from "./VoiceAssistant";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getDishes } from "../api/dishes";
import type { Dish } from "../types";

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function tokens(s: string) {
  return norm(s).split(" ").filter(Boolean);
}

function jaccard(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union ? inter / union : 0;
}

function bestDishMatch(dishes: Dish[], name: string) {
  const q = norm(name);
  if (!q) return null;

  // 1) exact
  const exact = dishes.find((d) => norm(d.name) === q);
  if (exact) return exact;

  // 2) includes
  const incl = dishes.find(
    (d) => norm(d.name).includes(q) || q.includes(norm(d.name))
  );
  if (incl) return incl;

  // 3) token similarity
  const qt = tokens(q);
  let best: { dish: Dish; score: number } | null = null;

  for (const d of dishes) {
    const hay = `${d.name} ${d.description ?? ""} ${(d.tags ?? []).join(" ")}`;
    const score = Math.max(
      jaccard(qt, tokens(d.name)),
      jaccard(qt, tokens(hay))
    );

    if (!best || score > best.score) best = { dish: d, score };
  }

  if (!best) return null;

  // поріг, щоб не додавало випадкове
  return best.score >= 0.34 ? best.dish : null;
}

export function VoiceOrchestrator() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const cart = useCart();

  const [dishes, setDishes] = useState<Dish[]>([]);
  const dishesRef = useRef<Dish[]>([]);
  useEffect(() => {
    dishesRef.current = dishes;
  }, [dishes]);

  useEffect(() => {
    // ✅ один VoiceAssistant на весь застосунок
    const va = new VoiceAssistant({ lang: "uk-UA" });

    (async () => {
      try {
        const data = await getDishes({});
        setDishes(data);
      } catch {
        setDishes([]);
      }
    })();

    return () => {
      try {
        va.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const routeMap = useMemo(
    () =>
      new Set([
        "/",
        "/menu",
        "/auth",
        "/cart",
        "/profile",
        "/checkout",
        "/admin",
      ]),
    []
  );

  useEffect(() => {
    const unsub = subscribeVoiceActions((a: VoiceAction) => {
      if (a.type === "stop_all") {
        window.voiceStop?.();
        return;
      }

      if (a.type === "navigate") {
        if (routeMap.has(a.path)) navigate(a.path);
        return;
      }

      if (a.type === "checkout_open") {
        navigate("/checkout");
        return;
      }

      if (a.type === "checkout_confirm") {
        if (!user) {
          navigate("/auth");
          window.voiceSay?.("Потрібно увійти, щоб оформити замовлення.");
          return;
        }
        if (location.pathname !== "/checkout") navigate("/checkout");
        window.voiceCheckoutConfirm?.();
        return;
      }

      if (a.type === "cart_clear") {
        cart.clear();
        window.voiceSay?.("Кошик очищено.");
        return;
      }

      if (a.type === "cart_add") {
        const d = bestDishMatch(dishesRef.current, a.name);
        if (d) {
          cart.add(d);
          window.voiceSay?.(`Додав ${d.name} в кошик.`);
        } else {
          window.voiceSay?.(`Не знайшов страву "${a.name}".`);
        }
        return;
      }

      if (a.type === "cart_remove") {
        const d = bestDishMatch(dishesRef.current, a.name);
        if (d) {
          cart.remove(d.id);
          window.voiceSay?.(`Прибрав ${d.name} з кошика.`);
        } else {
          window.voiceSay?.(`Не знайшов страву "${a.name}".`);
        }
        return;
      }

      if (a.type === "filters_clear") {
        // MenuPage сам скине UI через глобальну подію нижче
        window.dispatchEvent(new CustomEvent("voiceFiltersClear"));
        return;
      }

      if (a.type === "help") return;
    });

    return () => unsub();
  }, [navigate, cart, user, location.pathname, routeMap]);

  return null;
}
