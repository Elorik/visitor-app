import { useEffect, useState } from "react";
import type { Dish, Order, OrderStatus } from "../types";

const API_URL = "http://127.0.0.1:8000/api";

const theme = {
  bg: "#050505",
  cardBg: "#0a0a0a",
  text: "#e5e5e5",
  gold: "#d4a373",
  danger: "#e63946",
  success: "#2a9d8f",
  border: "#333",
};

const STATUS_MAP: Record<string, OrderStatus> = {
  "NEW": "new",
  "IN_PROGRESS": "processing",
  "COMPLETED": "ready"
};
const REVERSE_STATUS_MAP: Record<OrderStatus, string> = {
  "new": "NEW",
  "processing": "IN_PROGRESS",
  "ready": "COMPLETED"
};

interface AdminOrder extends Order {
  user_info?: { username: string; email: string } | null;
}

export function AdminPage() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<Dish>>({
    name: "", description: "", price: 0, category: "pizza", is_available: true,
  });

  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    if (token) {
      fetchDishes();
      fetchOrders();
    }
  }, [token]);

  const fetchDishes = async () => {
    try {
      const res = await fetch(`${API_URL}/dishes/`);
      if (res.ok) {
        const rawData = await res.json();
        const mappedDishes: Dish[] = rawData.map((d: any) => ({
          ...d,
          imageUrl: d.photo,
          category: typeof d.category === 'object' ? d.category.name : d.category,
          rating: d.rating || 0,
          tags: d.tags ? d.tags.split(',') : []
        }));
        setDishes(mappedDishes);
      }
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/`, {
        headers: { "Authorization": `Token ${token}` }
      });
      if (res.ok) {
        const rawData = await res.json();
        const mappedOrders: AdminOrder[] = rawData.map((o: any) => ({
          id: o.id,
          created_at: o.date,
          total: Number(o.sums),
          status: STATUS_MAP[o.status] || "new",
          user_info: o.user_info || null,
          items: o.items.map((i: any) => ({
            dish: { name: i.dish_name } as Dish,
            quantity: i.quantity,
            price: Number(i.price)
          }))
        }));
        setOrders(mappedOrders);
      }
    } catch (err) { console.error(err); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem("authToken", data.token);
      } else {
        setError("Невірний логін/пароль");
      }
    } catch { setError("Помилка сервера"); }
  };

  const handleSubmitDish = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `${API_URL}/dishes/${editingId}/` : `${API_URL}/dishes/`;
    const method = editingId ? "PATCH" : "POST";

    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "Authorization": `Token ${token}` },
        body: JSON.stringify(formData),
      });
      setEditingId(null);
      setFormData({ name: "", description: "", price: 0, category: "pizza", is_available: true });
      fetchDishes();
    } catch { alert("Помилка збереження"); }
  };

  const handleDeleteDish = async (id: number) => {
    if(!confirm("Видалити?")) return;
    try {
      await fetch(`${API_URL}/dishes/${id}/`, {
        method: "DELETE",
        headers: { "Authorization": `Token ${token}` },
      });
      setDishes(dishes.filter(d => d.id !== id));
      if (selectedDish?.id === id) setSelectedDish(null);
    } catch { alert("Помилка видалення"); }
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    const backendStatus = REVERSE_STATUS_MAP[newStatus];
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({ status: backendStatus })
      });

      if (res.ok) {
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch { alert("Не вдалося оновити статус"); }
  };

  const selectDishForEdit = (dish: Dish) => {
    setEditingId(dish.id);
    setFormData({
      name: dish.name,
      description: dish.description,
      price: dish.price,
      category: dish.category,
      is_available: dish.is_available,
    });
    setSelectedDish(dish);
  };

  if (!token) {
    return (
        <div style={{
          height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
          background: `radial-gradient(circle, #1a1a1a 0%, #000000 100%)`,
        }}>
          <form onSubmit={handleLogin} style={{
            background: "rgba(30,30,30,0.6)", backdropFilter: "blur(12px)",
            padding: "40px", borderRadius: "16px", border: `1px solid ${theme.gold}40`,
            width: "350px", textAlign: "center"
          }}>
            <h2 style={{ color: theme.gold, marginBottom: "20px" }}>LOGIN ADMIN</h2>
            {error && <div style={{ color: theme.danger, marginBottom: "10px" }}>{error}</div>}
            <input placeholder="Логін" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} />
            <button style={goldBtnStyle}>Увійти</button>
          </form>
        </div>
    );
  }

  return (
      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, padding: "20px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "15px" }}>
          <h1 style={{ margin: 0, color: theme.gold }}>Панель керування</h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setActiveTab("menu")} style={activeTab === "menu" ? activeTabStyle : tabStyle}>📜 Меню</button>
            <button onClick={() => { setActiveTab("orders"); fetchOrders(); }} style={activeTab === "orders" ? activeTabStyle : tabStyle}>📦 Замовлення</button>
            <button onClick={() => { setToken(null); localStorage.removeItem("authToken"); }} style={{...tabStyle, background: theme.danger, border: "none"}}>Вихід</button>
          </div>
        </div>

        {activeTab === "menu" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" }}>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, color: theme.gold }}>{editingId ? "Редагувати" : "Додати"}</h3>
                <form onSubmit={handleSubmitDish} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <input placeholder="Назва" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
                  <textarea placeholder="Опис" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{...inputStyle, minHeight: "60px"}} />
                  <input type="number" placeholder="Ціна" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} style={inputStyle} />
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle}>
                    <option value="pizza">Піца</option>
                    <option value="soup">Суп</option>
                    <option value="salad">Салат</option>
                    <option value="drink">Напій</option>
                  </select>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={goldBtnStyle}>{editingId ? "Зберегти" : "Додати"}</button>
                    {editingId && <button onClick={() => {setEditingId(null); setFormData({ name: "", description: "", price: 0, category: "pizza", is_available: true }); setSelectedDish(null);}} style={{...goldBtnStyle, background: "#444"}}>Скасувати</button>}
                  </div>
                </form>
              </div>

              <div style={{ ...cardStyle, overflowY: "auto", maxHeight: "80vh" }}>
                <h3 style={{ marginTop: 0, color: "#888" }}>Список ({dishes.length})</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                  {dishes.map(dish => (
                      <div key={dish.id} onClick={() => setSelectedDish(dish)} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: selectedDish?.id === dish.id ? "#222" : "#111",
                        padding: "10px", borderRadius: "8px", border: `1px solid ${selectedDish?.id === dish.id ? theme.gold : "#333"}`,
                        cursor: "pointer"
                      }}>
                        <div>
                          <div style={{ fontWeight: "bold", color: "white" }}>{dish.name}</div>
                          <div style={{ fontSize: "12px", color: "#666" }}>{dish.price} грн</div>
                        </div>
                        <div>
                          <button onClick={(e) => { e.stopPropagation(); selectDishForEdit(dish); }} style={iconBtnStyle}>✏️</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteDish(dish.id); }} style={{...iconBtnStyle, color: theme.danger, borderColor: theme.danger}}>🗑</button>
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              <div style={cardStyle}>
                <h3 style={{ marginTop: 0, color: theme.gold }}>👀 Перегляд</h3>
                {selectedDish ? (
                    <div style={{ textAlign: "center" }}>
                      <div style={{
                        width: "100%", height: "200px", background: "#222", borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "15px",
                        border: "1px dashed #444", color: "#666"
                      }}>
                        {selectedDish.imageUrl ? <img src={selectedDish.imageUrl} style={{maxWidth: "100%", maxHeight: "100%", objectFit: "contain"}} /> : "Фото відсутнє"}
                      </div>
                      <h2 style={{ margin: "0 0 10px 0" }}>{selectedDish.name}</h2>
                      <span style={{ background: theme.gold, color: "black", padding: "4px 10px", borderRadius: "15px", fontSize: "12px", fontWeight: "bold" }}>
                  {selectedDish.category}
                </span>
                      <p style={{ color: "#aaa", fontStyle: "italic" }}>{selectedDish.description || "Опису немає..."}</p>
                      <div style={{ fontSize: "24px", color: theme.gold, fontWeight: "bold" }}>{selectedDish.price} грн</div>
                      <div style={{ marginTop: "10px", fontSize: "12px", color: selectedDish.is_available ? theme.success : theme.danger }}>
                        {selectedDish.is_available ? "В наявності" : "Немає"}
                      </div>
                    </div>
                ) : (
                    <div style={{ color: "#666", textAlign: "center", padding: "50px 0" }}>Виберіть страву зі списку, щоб переглянути деталі</div>
                )}
              </div>

            </div>
        )}

        {activeTab === "orders" && (
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, color: theme.gold }}>Останні замовлення</h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                  <tr style={{ borderBottom: "1px solid #333", color: "#888" }}>
                    <th style={{ padding: "10px" }}>ID</th>
                    <th style={{ padding: "10px" }}>Клієнт</th>
                    <th style={{ padding: "10px" }}>Статус</th>
                    <th style={{ padding: "10px" }}>Склад</th>
                    <th style={{ padding: "10px" }}>Сума</th>
                    <th style={{ padding: "10px" }}>Дата</th>
                  </tr>
                  </thead>
                  <tbody>
                  {orders.map(order => (
                      <tr key={order.id} style={{ borderBottom: "1px solid #222" }}>
                        <td style={{ padding: "10px", color: "#666" }}>#{order.id}</td>

                        <td style={{ padding: "10px" }}>
                          {order.user_info ? (
                              <>
                                <div style={{ fontWeight: "bold", color: theme.gold }}>{order.user_info.username}</div>
                                <div style={{ fontSize: "12px", color: "#666" }}>{order.user_info.email}</div>
                              </>
                          ) : (
                              <div style={{ color: "#666", fontStyle: "italic" }}>Гість</div>
                          )}
                        </td>

                        <td style={{ padding: "10px" }}>
                          <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              style={{
                                background: order.status === "new" ? "#d4a373" : order.status === "ready" ? "#2a9d8f" : "#222",
                                color: order.status === "new" ? "black" : "white",
                                border: "none", padding: "5px", borderRadius: "5px", cursor: "pointer"
                              }}
                          >
                            <option value="new">Новий</option>
                            <option value="processing">В роботі</option>
                            <option value="ready">Готово</option>
                          </select>
                        </td>
                        <td style={{ padding: "10px" }}>
                          {order.items.map((item, idx) => (
                              <div key={idx} style={{ fontSize: "14px", color: "#bbb" }}>
                                • {item.dish.name} <span style={{ color: "#666" }}>x{item.quantity}</span>
                              </div>
                          ))}
                        </td>
                        <td style={{ padding: "10px", color: theme.gold, fontWeight: "bold" }}>{order.total} грн</td>
                        <td style={{ padding: "10px", fontSize: "12px", color: "#666" }}>{new Date(order.created_at).toLocaleString()}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
                {orders.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Замовлень поки немає</div>}
              </div>
            </div>
        )}
      </div>
  );
}

// --- СТИЛІ ---
const cardStyle: React.CSSProperties = {
  background: theme.cardBg,
  padding: "20px",
  borderRadius: "12px",
  border: `1px solid ${theme.border}`,
  height: "fit-content"
};
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  background: "#1a1a1a",
  border: "1px solid #333",
  color: "white",
  borderRadius: "6px",
  outline: "none"
};
const goldBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px",
  background: theme.gold,
  color: "black",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer"
};
const iconBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid #555",
  color: "white",
  padding: "5px 8px",
  borderRadius: "6px",
  cursor: "pointer",
  marginLeft: "5px"
};
const tabStyle: React.CSSProperties = {
  background: "#1a1a1a",
  color: "#888",
  border: "1px solid #333",
  padding: "8px 16px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "10px"
};
const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  background: theme.gold,
  color: "black",
  borderColor: theme.gold,
  fontWeight: "bold"
};