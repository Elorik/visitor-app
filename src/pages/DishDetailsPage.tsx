import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Dish, Review } from "../types";
import { getDish, getDishReviews } from "../api/dishes";
import { createReview } from "../api/reviews";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export function DishDetailsPage() {
  const { id } = useParams();
  const dishId = Number(id);
  const [dish, setDish] = useState<Dish | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const { add } = useCart();
  const { user } = useAuth();

  const load = async () => {
    try {
      const d = await getDish(dishId);
      const r = await getDishReviews(dishId);
      setDish(d);
      setReviews(r);
    } catch {
      // fallback, якщо бек не працює
      const mock: Dish = {
        id: dishId,
        name: dishId === 2 ? "Борщ" : "Маргарита",
        description:
          dishId === 2
            ? "Класичний український борщ."
            : "Піца з сиром та томатами.",
        price: dishId === 2 ? 120 : 180,
        category: dishId === 2 ? "soup" : "pizza",
        is_available: true,
        rating: 4.7,
        tags: ["демо"],
        imageUrl: "",
      };
      setDish(mock);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isNaN(dishId)) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dishId]);

  const handleReview = async () => {
    if (!user) {
      setError("Потрібно увійти, щоб залишити відгук.");
      return;
    }
    if (!rating || !comment.trim()) {
      setError("Заповни рейтинг і коментар.");
      return;
    }
    setError("");
    try {
      await createReview(dishId, rating, comment.trim());
      setComment("");
      await load();
    } catch {
      setError("Не вдалося відправити відгук (перевір бекенд).");
    }
  };

  if (loading) return <div>Завантаження...</div>;
  if (!dish) return <div>Страву не знайдено.</div>;

  return (
    <div style={{ maxWidth: "700px" }}>
      <h2>{dish.name}</h2>
      {dish.imageUrl && (
        <img
          src={dish.imageUrl}
          alt={dish.name}
          style={{ width: "100%", maxHeight: "260px", objectFit: "cover" }}
        />
      )}
      <p>{dish.description}</p>
      <p>Ціна: {dish.price} грн</p>
      <p>Рейтинг: {dish.rating.toFixed(1)} ⭐</p>
      <p>Наявність: {dish.is_available ? "Є" : "Немає"}</p>
      {dish.tags?.length > 0 && <p>Склад/теги: {dish.tags.join(", ")}</p>}
      <button onClick={() => add(dish)} disabled={!dish.is_available}>
        Додати в кошик
      </button>

      <h3 style={{ marginTop: "24px" }}>Відгуки</h3>
      {reviews.length === 0 && <div>Ще немає відгуків.</div>}
      {reviews.map((r) => (
        <div
          key={r.id}
          style={{
            padding: "6px 0",
            borderBottom: "1px solid #eee",
            fontSize: "14px",
          }}
        >
          <strong>{r.rating}⭐</strong> {r.comment}
        </div>
      ))}

      <h4 style={{ marginTop: "16px" }}>Залишити відгук</h4>
      {!user && <div>Увійди, щоб залишити відгук.</div>}
      {user && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            maxWidth: "400px",
          }}
        >
          <input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          />
          <textarea
            placeholder="Твій коментар"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          {error && (
            <div style={{ color: "red", fontSize: "13px" }}>{error}</div>
          )}
          <button onClick={handleReview}>Надіслати відгук</button>
        </div>
      )}
    </div>
  );
}
