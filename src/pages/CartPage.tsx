import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export function CartPage() {
  const { items, changeQty, remove, total } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return <div>Кошик порожній</div>;
  }

  return (
    <div>
      <h2>Кошик</h2>
      {items.map((i) => (
        <div
          key={i.dish.id}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span style={{ minWidth: "140px" }}>{i.dish.name}</span>
          <input
            type="number"
            min={1}
            value={i.quantity}
            onChange={(e) => changeQty(i.dish.id, Number(e.target.value))}
            style={{ width: "60px" }}
          />
          <span>{i.dish.price * i.quantity} грн</span>
          <button onClick={() => remove(i.dish.id)}>×</button>
        </div>
      ))}
      <div style={{ marginTop: "10px" }}>Разом: {total} грн</div>
      <button
        style={{ marginTop: "10px" }}
        onClick={() => navigate("/checkout")}
      >
        Оформити замовлення
      </button>
    </div>
  );
}
