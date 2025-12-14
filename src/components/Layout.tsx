// src/components/Layout.tsx
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { AnnaLogo } from "./AnnaLogo";
import { VoiceOrchestrator } from "../voice/VoiceOrchestrator"; // ✅ додай

export function Layout() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const userInitial = user?.username?.[0]?.toUpperCase() ?? "U";

  useEffect(() => {
    document.body.classList.add("page-fade");
    const t = setTimeout(
      () => document.body.classList.remove("page-fade"),
      250
    );
    return () => clearTimeout(t);
  }, [location.pathname]);

  const navClass = ({ isActive }: { isActive: boolean }) =>
    "nav-link" + (isActive ? " active" : "");

  return (
    <div className="app-root layout-wrapper">
      <VoiceOrchestrator /> {/* ✅ ОДИН раз на весь застосунок */}
      {/* HEADER */}
      <header className="site-header">
        <div className="site-header-inner">
          <Link to="/" className="site-logo">
            <AnnaLogo className="anna-logo" />
          </Link>

          <nav className="site-nav">
            <NavLink to="/" className={navClass} end>
              Головна
            </NavLink>

            <NavLink to="/menu" className={navClass}>
              Меню
            </NavLink>

            <NavLink to="/cart" className={navClass}>
              Кошик <span className="nav-pill">{cartCount}</span>
            </NavLink>

            {user && (
              <NavLink to="/profile" className={navClass}>
                Мій кабінет
              </NavLink>
            )}
          </nav>

          <div className="site-header-right">
            {user && (
              <div className="user-chip">
                <div className="user-avatar">{userInitial}</div>
                <span className="user-name">{user.username}</span>
              </div>
            )}

            {!user ? (
              <Link to="/auth" className="btn btn-outline small-btn">
                Увійти
              </Link>
            ) : (
              <button onClick={logout} className="btn btn-outline small-btn">
                Вийти
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="site-footer fixed-footer">
        <div className="site-footer-inner">
          <div className="site-footer__left">
            <div className="site-footer__title">Зв’язатися з нами</div>
            <div className="site-footer__contacts">
              <a href="tel:+380930558669">📞 +38 (093) 055 86 69</a>
              <span>·</span>
              <a href="mailto:info@restaurant.demo">✉ info@restaurant.demo</a>
            </div>
          </div>

          <div className="site-footer__right">
            <span className="site-footer__label">Ми в мережі</span>
            <div className="site-footer__socials">
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                📸 Instagram
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer">
                ▶ YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
