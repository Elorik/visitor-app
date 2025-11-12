import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/orders";
import type { Order } from "../types";

export function ProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch {
        // мок для демонстрації, якщо бек не працює
        setOrders([
          {
            id: 1,
            status: "ready",
            total: 300,
            created_at: "2025-01-01",
            items: [],
          },
        ] as Order[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (!user) return <div>Увійди, щоб переглянути кабінет.</div>;

  return (
    <div>
      <h2>Мій кабінет</h2>
      <p>Логін: {user.username}</p>
      <p>Email: {user.email}</p>

      <h3 style={{ marginTop: "16px" }}>Історія замовлень</h3>
      {loading && <div>Завантаження...</div>}
      {!loading && orders.length === 0 && <div>Замовлень поки немає.</div>}
      {orders.map((o) => (
        <div
          key={o.id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "8px",
            marginTop: "8px",
          }}
        >
          <div>Замовлення #{o.id}</div>
          <div>Статус: {o.status}</div>
          <div>Сума: {o.total} грн</div>
          <div>Створено: {o.created_at}</div>
        </div>
      ))}
    </div>
  );
}
