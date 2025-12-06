import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Dish, Review } from "../types";
import { getDish, getDishReviews } from "../api/dishes";
import { createReview } from "../api/reviews";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { mockDishes } from "../data/mockDishes";

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
      const localDish = mockDishes.find((d) => d.id === dishId) || null;
      setDish(localDish);
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
      setError(
        "Не вдалося відправити відгук (перевір статус замовлення в адмінці)."
      );
    }
  };

  if (loading) return <div className="panel">Завантаження...</div>;
  if (!dish) return <div className="panel">Страву не знайдено.</div>;

  const alreadyReviewed = !!user && reviews.some((r) => r.user === user.id);

  return (
    <div className="dish-details">
      <div className="panel">
        <div className="dish-details-header">
          <div className="dish-details-main">
            <h2 className="page-title">{dish.name}</h2>
            <p className="dish-details-price">
              {dish.price.toFixed(2)} <span>грн</span>
            </p>
            <p className="dish-details-meta">
              Рейтинг: {dish.rating.toFixed(1)} ⭐ ·{" "}
              {dish.is_available ? "Є в наявності" : "Немає зараз"}
            </p>
            {dish.tags?.length > 0 && (
              <p className="dish-details-tags">
                Склад / теги: {dish.tags.join(", ")}
              </p>
            )}
            <button
              className="btn btn-primary"
              onClick={() => add(dish)}
              disabled={!dish.is_available}
            >
              Додати в кошик
            </button>
          </div>

          {dish.imageUrl && (
            <div className="dish-details-image-wrap">
              <img
                src={dish.imageUrl}
                alt={dish.name}
                className="dish-details-image"
              />
            </div>
          )}
        </div>

        <p className="dish-details-description">{dish.description}</p>

        <section className="dish-reviews">
          <h3 className="section-title">Відгуки</h3>
          {reviews.length === 0 && (
            <div className="muted">Ще немає відгуків.</div>
          )}
          {reviews.map((r) => (
            <div key={r.id} className="review-row">
              <div className="review-rating">{r.rating}⭐</div>
              <div className="review-text">{r.comment}</div>
            </div>
          ))}

          <h4 className="section-title">Залишити відгук</h4>
          {!user && <div className="muted">Увійди, щоб залишити відгук.</div>}

          {user && alreadyReviewed && (
            <div className="muted">Ви вже залишили відгук на цю страву.</div>
          )}

          {user && !alreadyReviewed && (
            <div className="review-form">
              <input
                className="input"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              />
              <textarea
                className="input"
                placeholder="Твій коментар"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              {error && <div className="form-error">{error}</div>}
              <button className="btn btn-primary" onClick={handleReview}>
                Надіслати відгук
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
