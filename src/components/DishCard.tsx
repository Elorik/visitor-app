import { Link } from "react-router-dom";
import type { Dish } from "../types";
import { useCart } from "../context/CartContext";

export function DishCard({ dish }: { dish: Dish }) {
  const { add } = useCart();

  return (
    <div
      className="card"
      style={{ width: 230, display: "flex", flexDirection: "column", gap: 4 }}
    >
      {dish.imageUrl && (
        <img
          src={dish.imageUrl}
          alt={dish.name}
          style={{
            width: "100%",
            height: 130,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      )}
      <div style={{ fontWeight: 600 }}>{dish.name}</div>
      <div style={{ fontSize: 13, color: "#6b7280" }}>
        {dish.description.slice(0, 60)}...
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 14,
          marginTop: 4,
        }}
      >
        <span>{dish.price} грн</span>
        <span>⭐ {dish.rating.toFixed(1)}</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <Link className="btn btn-outline" to={`/dish/${dish.id}`}>
          Деталі
        </Link>
        <button
          className="btn"
          onClick={() => add(dish)}
          disabled={!dish.is_available}
          style={
            dish.is_available ? {} : { opacity: 0.6, cursor: "not-allowed" }
          }
        >
          {dish.is_available ? "У кошик" : "Немає"}
        </button>
      </div>
    </div>
  );
}
