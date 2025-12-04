import { useEffect, useState } from "react";
import type { Dish } from "../types";
import { getDishes, createDish, updateDish, deleteDish } from "../api/dishes";

// --- КОНФІГУРАЦІЯ ---
const ADMIN_PASSWORD = "1234"; // Твій пароль
const initialFormState: Omit<Dish, "id"> = {
    name: "", description: "", price: 0, category: "pizza", imageUrl: "", rating: 5, is_available: true, tags: []
};

export function AdminPage() {
    // --- Стейт для авторизації ---
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");

    // --- Стейт для даних ---
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormState);

    // Перевірка при завантаженні (щоб не вводити пароль щоразу при оновленні сторінки)
    useEffect(() => {
        const savedAuth = localStorage.getItem("isAdminAuth");
        if (savedAuth === "true") {
            setIsAuthorized(true);
            loadDishes();
        }
    }, []);

    // Функція входу
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === ADMIN_PASSWORD) {
            setIsAuthorized(true);
            localStorage.setItem("isAdminAuth", "true"); // Зберігаємо в пам'яті браузера
            loadDishes();
        } else {
            alert("Невірний пароль!");
        }
    };

    // Функція виходу
    const handleLogout = () => {
        setIsAuthorized(false);
        localStorage.removeItem("isAdminAuth");
        setPasswordInput("");
    };

    const loadDishes = async () => {
        const data = await getDishes({});
        setDishes(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === "price" ? Number(value) : value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateDish({ ...formData, id: editingId });
                setDishes(dishes.map(d => d.id === editingId ? { ...formData, id: editingId } : d));
            } else {
                const newDish = await createDish(formData);
                setDishes([...dishes, newDish]);
            }
            resetForm();
        } catch { alert("Помилка збереження"); }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Видалити?")) return;
        try {
            await deleteDish(id);
            setDishes(dishes.filter(d => d.id !== id));
        } catch { alert("Помилка видалення"); }
    };

    const startEdit = (dish: Dish) => { setEditingId(dish.id); setFormData(dish); };
    const resetForm = () => { setEditingId(null); setFormData(initialFormState); };

    // --- ЕКРАН ВХОДУ (ЯКЩО НЕ АВТОРИЗОВАНИЙ) ---
    if (!isAuthorized) {
        return (
            <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <form onSubmit={handleLogin} style={{ border: "1px solid #ccc", padding: 40, borderRadius: 10, textAlign: "center" }}>
                    <h2>Вхід для адміністратора</h2>
                    <input
                        type="password"
                        placeholder="Введіть пароль"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        style={{ padding: 10, marginBottom: 10, display: "block", width: "100%" }}
                    />
                    <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>Увійти</button>
                </form>
            </div>
        );
    }

    // --- ОСНОВНИЙ ЕКРАН АДМІНКИ ---
    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2>Адмін-панель: Меню</h2>
                <button onClick={handleLogout} style={{ background: "#ff4d4f", color: "white", border: "none", padding: "8px 16px", borderRadius: 4 }}>
                    Вийти
                </button>
            </div>

            {/* Форма додавання */}
            <div style={{ background: "#f5f5f5", padding: 15, marginBottom: 20, borderRadius: 8, marginTop: 20 }}>
                <h3>{editingId ? "Редагувати страву" : "Додати нову страву"}</h3>
                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, maxWidth: 400 }}>
                    <input name="name" placeholder="Назва страви" value={formData.name} onChange={handleChange} required />
                    <input name="description" placeholder="Опис" value={formData.description} onChange={handleChange} />
                    <input name="price" type="number" placeholder="Ціна" value={formData.price} onChange={handleChange} required />
                    <select name="category" value={formData.category} onChange={handleChange}>
                        <option value="pizza">Піца</option>
                        <option value="soup">Суп</option>
                        <option value="salad">Салат</option>
                        <option value="drink">Напої</option>
                    </select>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button type="submit">{editingId ? "Зберегти" : "Додати"}</button>
                        {editingId && <button type="button" onClick={resetForm}>Скасувати</button>}
                    </div>
                </form>
            </div>

            {/* Таблиця */}
            <table border={1} style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                <tr><th>ID</th><th>Назва</th><th>Категорія</th><th>Ціна</th><th>Дії</th></tr>
                </thead>
                <tbody>
                {dishes.map(dish => (
                    <tr key={dish.id}>
                        <td>{dish.id}</td><td>{dish.name}</td><td>{dish.category}</td><td>{dish.price} грн</td>
                        <td>
                            <button onClick={() => startEdit(dish)} style={{ marginRight: 5 }}>✏️</button>
                            <button onClick={() => handleDelete(dish.id)} style={{ color: "red" }}>🗑</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}