// src/pages/HomePage.tsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGoToProfile = () => {
    if (user) {
      navigate("/profile");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="home route-fade">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <span className="badge">Авторська кухня</span>

          <h1 className="home-title">Смак, який говорить сам за себе</h1>

          <p className="home-subtitle">
            Сучасний ресторан із теплим сервісом, свіжими інгредієнтами та
            продуманим меню. Замовляй онлайн — без черг і зайвих дзвінків.
          </p>

          <div className="home-actions">
            <Link to="/menu" className="btn btn-primary">
              Перейти до меню
            </Link>
            <button
              type="button"
              onClick={handleGoToProfile}
              className="btn btn-ghost"
            >
              Увійти в кабінет
            </button>
          </div>
        </div>

        <aside className="home-hero-side">
          <div className="home-hero-card">
            <div className="home-hero-card-row">
              <span className="label">Сьогоднішній хіт</span>
              <span className="value">Маргарита з базиліком</span>
            </div>
            <div className="home-hero-card-row">
              <span className="label">Середній час приготування</span>
              <span className="value">15–20 хв</span>
            </div>
            <div className="home-hero-card-row">
              <span className="label">Онлайн-замовлень сьогодні</span>
              <span className="value">48+</span>
            </div>
          </div>
        </aside>
      </section>

      {/* FEATURES PANEL – три блоки в одній панелі з плавною появою */}
      <section className="home-features-section">
        <div className="home-features-panel">
          <div className="home-features-header">
            <h2 className="home-features-title">Чому гості повертаються</h2>
            <p className="home-features-subtitle">
              Три прості речі, заради яких ANNA стає улюбленим місцем.
            </p>
          </div>

          <div className="home-features-grid">
            <article className="home-feature-card home-feature-card--1">
              <h3>Свіжі інгредієнти</h3>
              <p>
                Працюємо тільки з перевіреними постачальниками та сезонними
                продуктами. Без компромісів щодо якості та смаку.
              </p>
            </article>

            <article className="home-feature-card home-feature-card--2">
              <h3>Швидке замовлення</h3>
              <p>
                Меню, кошик і опрацювання замовлень — у кілька кліків або
                голосом. Система пам’ятає ваші вподобання.
              </p>
            </article>

            <article className="home-feature-card home-feature-card--3">
              <h3>Чесні відгуки</h3>
              <p>
                Кожну страву можуть оцінити лише ті, хто справді її замовляв.
                Жодних накручених рейтингів — тільки реальний досвід гостей.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
