import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export function CartPage() {
  const { items, changeQty, remove, total } = useCart();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="panel cart-panel">
        <h2 className="page-title">Кошик</h2>
        <p className="muted">Кошик порожній.</p>
      </div>
    );
  }

  return (
    <div className="panel cart-panel">
      <h2 className="page-title">Кошик</h2>

      <div className="cart-list">
        {items.map((i) => (
          <div key={i.dish.id} className="cart-row">
            <div className="cart-row-main">
              <span className="cart-dish-name">{i.dish.name}</span>
              <div className="cart-row-controls">
                <input
                  className="input cart-qty"
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => changeQty(i.dish.id, Number(e.target.value))}
                />
                <span className="cart-price">
                  {(i.dish.price * i.quantity).toFixed(2)} грн
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost cart-remove"
              onClick={() => remove(i.dish.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="cart-footer">
        <div className="cart-total">Разом: {total.toFixed(2)} грн</div>
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate("/checkout")}
        >
          Оформити замовлення
        </button>
      </div>
    </div>
  );
}
