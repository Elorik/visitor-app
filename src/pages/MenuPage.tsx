import { useEffect, useState, useRef } from "react";
import type { Dish, VoiceFilters } from "../types";
import { DishCard } from "../components/DishCard";
import { FiltersBar } from "../components/FiltersBar";
import { WaiterWidget } from "../components/WaiterWidget";
import { VoiceAssistant } from "../voice/VoiceAssistant";
import { subscribeVoiceFilters } from "../voice/VoiceIntegration";

// Mock dishes
import { mockDishes } from "../data/mockDishes";

export function MenuPage() {
  const [dishes, setDishes] = useState<Dish[]>(mockDishes);
  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [voiceFilters, setVoiceFilters] = useState<VoiceFilters | null>(null);

  const vaRef = useRef<VoiceAssistant | null>(null);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setVoiceFilters(prev => prev ? { ...prev, tags: [] } : null);
  };

  const filterDishes = (filters: { category?: string; maxPrice?: number; tags?: string[] }) => {
    let result = [...mockDishes];
    

    if (filters.category && filters.category !== "all") {
      result = result.filter(d => d.category === filters.category);
    }

    if (filters.maxPrice != null) {
      result = result.filter(d => d.price <= filters.maxPrice!);
    }

    if (filters.tags && filters.tags.length > 0) {
      const wanted = filters.tags.map(t => String(t).toLowerCase());
      result = result.filter(d => {
        const dishTagsLower = (d.tags || []).map(x => String(x).toLowerCase());
        // OR: хоч би один тег співпав
        return wanted.some(w => dishTagsLower.includes(w));
        // AND замість OR:
        // return wanted.every(w => dishTagsLower.includes(w));
      });
    }

    if (sort === "-rating") result.sort((a, b) => b.rating - a.rating);
    if (sort === "price") result.sort((a, b) => a.price - b.price);
    if (sort === "-price") result.sort((a, b) => b.price - a.price);

    setDishes(result);
  };

  useEffect(() => {
    const vf = voiceFilters;

    filterDishes({
      category: category || vf?.category || undefined,
      maxPrice: maxPrice ? Number(maxPrice) : vf?.maxPrice ?? undefined,
      tags: vf?.tags?.length ? vf.tags : undefined,
    });
  }, [category, maxPrice, sort, voiceFilters]);

  useEffect(() => {
    const unsub = subscribeVoiceFilters((vf: VoiceFilters) => {
      console.log("VOICE FILTERS:", vf);

      // 1) Спочатку повністю скидаємо UI-фільтри
      setCategory("");
      setMaxPrice("");
      setSort("");

      // 2) Потім підставляємо нові значення з голосу
      if (vf.category) setCategory(vf.category);
      if (vf.maxPrice != null) setMaxPrice(String(vf.maxPrice));

      // tags ми не пишемо в UI-фільтри, бо вони окремо ходять через voiceFilters
      setVoiceFilters(vf);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    vaRef.current = new VoiceAssistant({
      onText: (t) => { window.__lastVoiceText = t; },
      onStateChange: (s) => console.log("voice state:", s),
    });

    return () => vaRef.current?.stop();
  }, []);

  return (
    <div className="layout-flex" style={{ display: "flex", gap: 16 }}>
      <div style={{ flex: 1 }}>
        <h2 className="page-title">Меню</h2>

        <FiltersBar
          category={category}
          setCategory={handleCategoryChange}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sort={sort}
          setSort={setSort}
        />

        <div className="dish-grid">
          {dishes.map((dish) => (
            <DishCard key={dish.id} dish={dish} />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => vaRef.current?.start()}>🎤 Голос</button>
        <button onClick={() => vaRef.current?.stop()}>⏹ Стоп</button>
      </div>

      <WaiterWidget />
    </div>
  );
}