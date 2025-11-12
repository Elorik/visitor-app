import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export function Layout() {
  const { user, logout } = useAuth();
  const { items } = useCart();

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
        }}
      >
        <Link
          to="/"
          style={{
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: "0.03em",
          }}
        >
          Restaurant
        </Link>

        <nav
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
            fontSize: 14,
          }}
        >
          <Link to="/">Меню</Link>
          <Link to="/cart">Кошик ({cartCount})</Link>
          {user && <Link to="/profile">Мій кабінет</Link>}
          {!user ? (
            <Link
              to="/auth"
              className="btn btn-outline"
              style={{ padding: "6px 14px", fontSize: 13 }}
            >
              Увійти
            </Link>
          ) : (
            <button
              onClick={logout}
              className="btn btn-outline"
              style={{ padding: "6px 14px", fontSize: 13 }}
            >
              Вийти
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
