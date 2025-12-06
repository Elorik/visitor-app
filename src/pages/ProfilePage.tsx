// src/pages/ProfilePage.tsx
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyOrders } from "../api/orders";
import type { Order } from "../types";

export function ProfilePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  // "банківська карта" суто на фронті
  const [cardNumber, setCardNumber] = useState("");
  const [cardLast4, setCardLast4] = useState<string | null>(null);
  const [cardLinked, setCardLinked] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch {
        // мок якщо бек лежить
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

  if (!user) {
    return (
      <div className="panel">
        <h2 className="page-title">Мій кабінет</h2>
        <p className="muted">
          Увійди, щоб переглянути кабінет та історію замовлень.
        </p>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const bonusPoints = Math.floor(totalSpent / 10);

  let tier = "Новий гість";
  if (totalSpent >= 1500) tier = "Друг ресторану";
  else if (totalSpent >= 500) tier = "Постійний гість";

  const handleLinkCard = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = cardNumber.replace(/\s+/g, "");
    if (cleaned.length < 12) return;
    setCardLast4(cleaned.slice(-4));
    setCardLinked(true);
    setCardNumber("");
  };

  return (
    <div className="profile-page">
      {/* Верхній блок: інформація + карта */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.1fr) minmax(260px, 1.4fr)",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Ліва панель — акаунт + бонуси + прив’язка карти */}
        <section className="panel">
          <h2 className="page-title">Мій кабінет</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1.2fr)",
              gap: 16,
            }}
          >
            <div>
              <h3 className="section-title">Профіль</h3>
              <p>
                <strong>Логін:</strong> {user.username}
              </p>
              <p>
                <strong>Email:</strong> {user.email || "—"}
              </p>
              <p className="muted" style={{ marginTop: 6 }}>
                Статус гостя: <strong>{tier}</strong>
              </p>
            </div>

            <div>
              <h3 className="section-title">Бонуси</h3>
              <p>
                <strong>Накопичено:</strong> {bonusPoints} балів
              </p>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                Ми умовно нараховуємо 1 бал за кожні 10 грн замовлення. У
                реальному проєкті тут можна підключити програму лояльності.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3 className="section-title">Платіжна карта</h3>
            <p className="muted" style={{ fontSize: 13 }}>
              Це демо-блок: ми ніде не зберігаємо справжні дані, тільки
              візуалізуємо карту на цій сторінці.
            </p>

            <form
              onSubmit={handleLinkCard}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                marginTop: 10,
                flexWrap: "wrap",
              }}
            >
              <input
                className="input"
                placeholder="Номер карти (демо)"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                style={{ maxWidth: 260 }}
              />
              <button type="submit" className="btn btn-outline">
                {cardLinked ? "Оновити карту" : "Прив’язати карту"}
              </button>
            </form>
          </div>
        </section>

        {/* Права панель — візуалізація карти + корисні дрібниці */}
        <aside className="panel">
          <h3 className="section-title">Моя карта</h3>

          <div
            style={{
              marginTop: 8,
              marginBottom: 14,
              fontSize: 13,
              color: "var(--text-soft)",
            }}
          >
            {cardLinked && cardLast4 ? (
              <>Прив’язана карта для швидких замовлень.</>
            ) : (
              <>Прив’яжи карту, щоб пришвидшити оформлення замовлень.</>
            )}
          </div>

          {/* «Пластикова» карта */}
          <div
            style={{
              borderRadius: 18,
              padding: 16,
              background:
                "radial-gradient(circle at 0% 0%, #d5af6e 0, #3b2b1a 35%, #090807 100%)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.8)",
              color: "#fdfaf5",
              minHeight: 140,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.16em",
              }}
            >
              <span>Visa</span>
              <span>Virtual Card</span>
            </div>

            <div style={{ fontSize: 18, marginTop: 10, letterSpacing: 2 }}>
              {cardLinked && cardLast4
                ? `**** **** **** ${cardLast4}`
                : "**** **** **** ****"}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                fontSize: 11,
              }}
            >
              <div>
                <div style={{ opacity: 0.7 }}>Власник</div>
                <div style={{ textTransform: "uppercase" }}>
                  {user.username || "ANNA GUEST"}
                </div>
              </div>
              <div>
                <div style={{ opacity: 0.7 }}>Рівень</div>
                <div>{tier}</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 12 }} className="muted">
            Щоб показати реальну інтеграцію, достатньо в пояснювальній записці
            описати, як би тут підключався платіжний сервіс (LiqPay, Fondy,
            Stripe тощо).
          </div>
        </aside>
      </div>

      {/* Історія замовлень */}
      <section className="panel">
        <h3 className="section-title">Історія замовлень</h3>
        {loading && <div className="muted">Завантаження...</div>}

        {!loading && orders.length === 0 && (
          <div className="muted">Замовлень поки немає.</div>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((o) => (
              <div key={o.id} className="order-card">
                <div className="order-header">
                  <span>Замовлення #{o.id}</span>
                  <span className={`order-status status-${o.status}`}>
                    {o.status === "new"
                      ? "Нове"
                      : o.status === "processing"
                      ? "В процесі"
                      : "Готове"}
                  </span>
                </div>
                <div className="order-meta">
                  <div>Сума: {o.total} грн</div>
                  <div>Створено: {o.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
