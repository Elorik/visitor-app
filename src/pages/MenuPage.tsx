import { useEffect, useState } from "react";
import type { Dish, VoiceFilters } from "../types";
import { getDishes } from "../api/dishes";
import { DishCard } from "../components/DishCard";
import { FiltersBar } from "../components/FiltersBar";
import { subscribeVoiceFilters } from "../voice/VoiceIntegration";
import { WaiterWidget } from "../components/WaiterWidget";

export function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");

  // стандартне завантаження по локальних фільтрах
  const load = async () => {
    setLoading(true);
    try {
      const data = await getDishes({
        category: category || undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        ordering: sort || undefined,
      });
      setDishes(data);
    } catch {
      // мок для демонстрації, якщо бек не працює
      setDishes([
        {
          id: 1,
          name: "Маргарита",
          description: "Піца з сиром та томатами",
          price: 180,
          category: "pizza",
          is_available: true,
          rating: 4.5,
          tags: ["сир", "томат"],
          imageUrl: "",
        },
        {
          id: 2,
          name: "Борщ",
          description: "Класичний український борщ",
          price: 120,
          category: "soup",
          is_available: true,
          rating: 4.8,
          tags: ["м'ясо", "овочі"],
          imageUrl: "",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // завантаження за фільтрами від голосового асистента
  const loadWithFilters = async (vf: VoiceFilters) => {
    setLoading(true);
    try {
      const data = await getDishes({
        category: vf.category || undefined,
        maxPrice: vf.maxPrice ?? undefined,
        tags: vf.tags?.length ? vf.tags : undefined,
      });
      setDishes(data);

      if (vf.category) setCategory(vf.category);
      if (vf.maxPrice != null) setMaxPrice(String(vf.maxPrice));
    } catch {
      // можна лишити порожнім або повторити мок
    } finally {
      setLoading(false);
    }
  };

  // виклик API при зміні фільтрів з інтерфейсу
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, maxPrice, sort]);

  // підписка на голосовий асистент
  useEffect(() => {
    const unsub = subscribeVoiceFilters(loadWithFilters);
    return unsub;
  }, []);

  return (
    <div className="layout-flex" style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <h2 className="page-title">Меню</h2>
        <FiltersBar
          category={category}
          setCategory={setCategory}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sort={sort}
          setSort={setSort}
        />
        {loading && <div>Завантаження страв...</div>}
        <div className="dish-grid">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </div>

      <WaiterWidget />
    </div>
  );
}
