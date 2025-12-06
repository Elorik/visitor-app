// src/pages/MenuPage.tsx
import {
  useEffect,
  useState,
  useRef,
  useCallback,
  type WheelEvent,
} from "react";
import type { Dish, VoiceFilters } from "../types";
import { DishCard } from "../components/DishCard";
import { FiltersBar } from "../components/FiltersBar";
import { WaiterWidget } from "../components/WaiterWidget";
import { VoiceAssistant } from "../voice/VoiceAssistant";
import { subscribeVoiceFilters } from "../voice/VoiceIntegration";
import { getDishes } from "../api/dishes";
import { mockDishes } from "../data/mockDishes";

declare global {
  interface Window {
    __lastVoiceText?: string;
  }
}

export function MenuPage() {
  const [allDishes, setAllDishes] = useState<Dish[]>(mockDishes);
  const [categoryGroups, setCategoryGroups] = useState<Record<string, Dish[]>>(
    {}
  );
  const [filteredGroups, setFilteredGroups] = useState<Record<string, Dish[]>>(
    {}
  );

  const [category, setCategory] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");
  const [voiceFilters, setVoiceFilters] = useState<VoiceFilters | null>(null);

  const [viewMode, setViewMode] = useState<"book" | "grid">("book");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  );

  const vaRef = useRef<VoiceAssistant | null>(null);

  // групування по категоріях
  const buildGroups = useCallback((list: Dish[]) => {
    const groups: Record<string, Dish[]> = {};
    list.forEach((d) => {
      if (!groups[d.category]) groups[d.category] = [];
      groups[d.category].push(d);
    });
    return groups;
  }, []);

  // фільтрація
  const applyFilters = useCallback(() => {
    let list = [...allDishes];

    const selectedCategory = category || voiceFilters?.category || "";

    if (selectedCategory && selectedCategory !== "all") {
      list = list.filter((d) => d.category === selectedCategory);
    }

    const maxP = maxPrice ? Number(maxPrice) : voiceFilters?.maxPrice;
    if (maxP) {
      list = list.filter((d) => d.price <= maxP);
    }

    if (voiceFilters?.tags?.length) {
      const need = voiceFilters.tags.map((t) => t.toLowerCase());
      list = list.filter((d) =>
        (d.tags || []).some((tag) => need.includes(tag.toLowerCase()))
      );
    }

    if (sort === "-rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "price") list.sort((a, b) => a.price - b.price);
    if (sort === "-price") list.sort((a, b) => b.price - a.price);

    const groups = buildGroups(list);
    setFilteredGroups(groups);

    if (selectedCategory && groups[selectedCategory]) {
      setOpenCategories({ [selectedCategory]: true });
    }
  }, [allDishes, category, maxPrice, sort, voiceFilters, buildGroups]);

  // завантаження з бекенду
  useEffect(() => {
    (async () => {
      try {
        const data = await getDishes({});
        const groups = buildGroups(data);
        setAllDishes(data);
        setCategoryGroups(groups);
        setFilteredGroups(groups);
        // спочатку всі категорії відкриті
        const allOpen: Record<string, boolean> = {};
        Object.keys(groups).forEach((k) => (allOpen[k] = true));
        setOpenCategories(allOpen);
      } catch {
        const groups = buildGroups(mockDishes);
        setAllDishes(mockDishes);
        setCategoryGroups(groups);
        setFilteredGroups(groups);
        const allOpen: Record<string, boolean> = {};
        Object.keys(groups).forEach((k) => (allOpen[k] = true));
        setOpenCategories(allOpen);
      }
    })();
  }, [buildGroups]);

  // перефільтр при зміні фільтрів
  useEffect(() => {
    applyFilters();
  }, [category, maxPrice, sort, voiceFilters, applyFilters]);

  // підписка на голосові фільтри
  useEffect(() => {
    const unsub = subscribeVoiceFilters((vf: VoiceFilters) => {
      setCategory("");
      setMaxPrice("");
      setSort("");
      setVoiceFilters(vf);
    });
    return () => unsub();
  }, []);

  // життєвий цикл голосового асистента
  useEffect(() => {
    vaRef.current = new VoiceAssistant({
      onText: (t) => {
        window.__lastVoiceText = t;
      },
      onStateChange: (s) => console.log("voice state:", s),
    });
    return () => vaRef.current?.stop();
  }, []);

  // згортання / розгортання категорії
  const toggleCategoryOpen = (cat: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // горизонтальний скрол колесиком
  const handleRowWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const renderDishRows = () => {
    return Object.entries(filteredGroups).map(([cat, dishes]) => (
      <div key={cat} className="category-block">
        <div
          className="category-header"
          onClick={() => toggleCategoryOpen(cat)}
        >
          <h3 className="category-title">{cat}</h3>
          <span className="category-toggle">
            {openCategories[cat] ? "▲" : "▼"}
          </span>
        </div>

        <div
          className={`category-row ${openCategories[cat] ? "open" : "closed"}`}
        >
          <div className="dish-row-scroll" onWheel={handleRowWheel}>
            {dishes.map((dish) => (
              <div key={dish.id} className="dish-anim">
                <DishCard dish={dish} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ));
  };

  const renderDishGrid = () => {
    return (
      <div className="dish-grid dish-grid-animated">
        {Object.values(filteredGroups)
          .flat()
          .map((dish) => (
            <div key={dish.id} className="dish-anim">
              <DishCard dish={dish} />
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="menu-layout">
      <section className="menu-main">
        <div className="menu-top-bar">
          <h2 className="page-title">Меню</h2>
          <button
            className="btn btn-outline small-btn"
            onClick={() => setViewMode(viewMode === "book" ? "grid" : "book")}
          >
            Вид: {viewMode === "book" ? "Сітка" : "Книжка"}
          </button>
        </div>

        <FiltersBar
          category={category}
          setCategory={setCategory}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sort={sort}
          setSort={setSort}
        />

        {viewMode === "book" ? renderDishRows() : renderDishGrid()}
      </section>

      <aside className="menu-side">
        <div className="menu-voice-controls">
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => vaRef.current?.start()}
          >
            Голос
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => vaRef.current?.stop()}
          >
            Стоп
          </button>
        </div>
        <WaiterWidget />
      </aside>
    </div>
  );
}
