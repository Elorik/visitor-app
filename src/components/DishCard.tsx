// src/components/DishCard.tsx
import type { Dish } from "../types";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

interface Props {
  dish: Dish;
}

export function DishCard({ dish }: Props) {
  const { add } = useCart();

  const handleAdd = () => {
    add(dish);
  };

  const shortDescription =
    dish.description && dish.description.length > 90
      ? dish.description.slice(0, 90) + "…"
      : dish.description || "";

  const hasImage = !!dish.imageUrl;

  return (
    <article className="dish-card">
      {hasImage && (
        <div className="dish-card__image-wrap">
          <img
            src={dish.imageUrl}
            alt={dish.name}
            className="dish-card__image"
          />
        </div>
      )}

      <div className="dish-card__body">
        <div className="dish-card__header">
          <h3 className="dish-card__title">{dish.name}</h3>
          <div className="dish-card__price">
            {dish.price.toFixed(0)} грн <span>/ порція</span>
          </div>
        </div>

        {shortDescription && (
          <p className="dish-card__description">{shortDescription}</p>
        )}

        <div className="dish-card__meta">
          <div className="dish-card__rating">
            {dish.rating ? `${dish.rating.toFixed(1)} ★` : "Без рейтингу"}
          </div>
          <div className="dish-card__badge badge-muted">
            {dish.is_available ? "В наявності" : "Тимчасово немає"}
          </div>
        </div>

        <div className="dish-card__actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!dish.is_available}
          >
            Додати в кошик
          </button>

          <Link to={`/dish/${dish.id}`} className="btn btn-ghost">
            Детальніше
          </Link>
        </div>
      </div>
    </article>
  );
}
