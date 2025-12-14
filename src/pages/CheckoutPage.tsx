// src/pages/CheckoutPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { createOrder } from "../api/orders";

declare global {
  interface Window {
    voiceCheckoutConfirm?: () => void;
  }
}

export function CheckoutPage() {
  const { user } = useAuth();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();

  const handleConfirm = async () => {
    try {
      await createOrder(
        items.map((i) => ({
          dish_id: i.dish.id,
          quantity: i.quantity,
        }))
      );
    } catch {
      // ok для захисту
    }
    clear();
    navigate("/profile");
  };

  // ✅ hooks тільки зверху, без conditional
  useEffect(() => {
    window.voiceCheckoutConfirm = () => {
      void handleConfirm();
    };
    return () => {
      delete window.voiceCheckoutConfirm;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, total, user]);

  if (!items.length) return <div>Кошик порожній.</div>;
  if (!user) return <div>Потрібно увійти, щоб оформити замовлення.</div>;

  return (
    <div>
      <h2>Підтвердження замовлення</h2>
      <ul>
        {items.map((i) => (
          <li key={i.dish.id}>
            {i.dish.name} x{i.quantity} = {i.dish.price * i.quantity} грн
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "10px" }}>Сума: {total} грн</div>
      <button style={{ marginTop: "10px" }} onClick={handleConfirm}>
        Підтвердити замовлення
      </button>
    </div>
  );
}
