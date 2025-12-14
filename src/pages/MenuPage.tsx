// src/pages/MenuPage.tsx
import {
  useEffect,
  useState,
  useCallback,
  type WheelEvent,
  useMemo,
} from "react";
import type { Dish, VoiceFilters } from "../types";
import { DishCard } from "../components/DishCard";
import { FiltersBar } from "../components/FiltersBar";
import { WaiterWidget } from "../components/WaiterWidget";
import { subscribeVoiceFilters } from "../voice/VoiceIntegration";
import { getDishes } from "../api/dishes";
import { mockDishes } from "../data/mockDishes";

type MenuFilters = {
  category?: string;
  priceFrom?: number;
  priceTo?: number;
  ratingFrom?: number;
  sort?: "price_asc" | "price_desc" | "rating_desc";
  query?: string;
  tags?: string[];
};

declare global {
  interface Window {
    __lastVoiceText?: string;
    voiceStart?: () => void;
    voiceStop?: () => void;
  }
}

function normalizeStr(s: string) {
  return (s ?? "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/[’'`]/g, "")
    .replace(/\s+/g, " ");
}

function countDishesByCategory(dishes: Dish[]) {
  const m = new Map<string, number>();
  for (const d of dishes) {
    const c = (d.category ?? "").trim();
    if (!c) continue;
    m.set(c, (m.get(c) ?? 0) + 1);
  }
  return m;
}

function pickCategoryLabelFromVoice(
  voiceRaw: string,
  categories: string[],
  dishes: Dish[]
): string | null {
  const v = normalizeStr(voiceRaw);
  if (!v) return null;

  const exact = categories.find((c) => normalizeStr(c) === v);
  if (exact) return exact;

  const counts = countDishesByCategory(dishes);

  const intent =
    v === "pizza" || /(піц|пиц)/.test(v)
      ? "pizza"
      : v === "soup" || /(суп|борщ|бульйон)/.test(v)
      ? "soup"
      : v === "salad" || /(салат)/.test(v)
      ? "salad"
      : v === "dessert" ||
        v === "desserts" ||
        /(десерт|солодк|солодощ|смакол|випічк|тістечк|торт|тіраміс|пудинг|морозив)/.test(
          v
        )
      ? "dessert"
      : v === "drink" ||
        v === "drinks" ||
        /(нап|пит|кава|чай|сік|вода|кола)/.test(v)
      ? "drink"
      : null;

  if (!intent) {
    return (
      categories.find((c) => normalizeStr(c).includes(v)) ||
      categories.find((c) => v.includes(normalizeStr(c))) ||
      null
    );
  }

  const patternsByIntent: Record<string, RegExp[]> = {
    pizza: [/(pizza)/, /(піц|пиц)/],
    soup: [/(soup)/, /(суп|борщ|бульйон)/],
    salad: [/(salad)/, /(салат)/],
    dessert: [
      /(dessert|sweet)/,
      /(десерт|солодк|солодощ|смакол|випічк|тістечк|торт|тіраміс|пудинг|морозив)/,
    ],
    drink: [/(drink|drinks)/, /(нап|пит|кава|чай|сік|вода|кола)/],
  };

  const patterns = patternsByIntent[intent];

  const candidates = categories.filter((c) => {
    const nc = normalizeStr(c);
    return patterns.some((re) => re.test(nc));
  });

  if (!candidates.length) return null;

  return candidates.slice().sort((a, b) => {
    const ca = counts.get(a) ?? 0;
    const cb = counts.get(b) ?? 0;
    if (cb !== ca) return cb - ca;
    return a.length - b.length;
  })[0];
}

export function MenuPage() {
  const [allDishes, setAllDishes] = useState<Dish[]>(mockDishes);
  const [, setCategoryGroups] = useState<Record<string, Dish[]>>({});
  const [filteredGroups, setFilteredGroups] = useState<Record<string, Dish[]>>(
    {}
  );

  // UI
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");

  // source of truth
  const [filters, setFilters] = useState<MenuFilters>({});

  const [viewMode, setViewMode] = useState<"book" | "grid">("book");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    {}
  );

  const buildGroups = useCallback((list: Dish[]) => {
    const groups: Record<string, Dish[]> = {};
    const labelByNorm: Record<string, string> = {};

    for (const d of list) {
      const raw = (d.category || "Без категорії").trim();
      const norm = normalizeStr(raw);

      if (!labelByNorm[norm]) labelByNorm[norm] = raw;
      const label = labelByNorm[norm];

      if (!groups[label]) groups[label] = [];
      groups[label].push(d);
    }
    return groups;
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const d of allDishes) {
      const c = (d.category ?? "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "uk"));
  }, [allDishes]);

  useEffect(() => {
    if (category === "all") return;
    const ok = categories.some(
      (c) => normalizeStr(c) === normalizeStr(category)
    );
    if (!ok) setCategory("all");
  }, [categories, category]);

  // UI -> filters
  useEffect(() => {
    setFilters((prev): MenuFilters => {
      const priceToRaw = maxPrice ? Number(maxPrice) : undefined;
      const priceTo =
        typeof priceToRaw === "number" && !Number.isNaN(priceToRaw)
          ? priceToRaw
          : undefined;

      const mappedSort: MenuFilters["sort"] =
        sort === "-rating"
          ? "rating_desc"
          : sort === "price"
          ? "price_asc"
          : sort === "-price"
          ? "price_desc"
          : undefined;

      return {
        ...prev,
        category: category !== "all" ? category : undefined,
        priceTo,
        sort: mappedSort,
      };
    });
  }, [category, maxPrice, sort]);

  const applyFilters = useCallback(() => {
    let list = [...allDishes];

    if (filters.category) {
      const target = normalizeStr(filters.category);
      list = list.filter((d) => normalizeStr(d.category || "") === target);
    }

    if (typeof filters.priceTo === "number" && !Number.isNaN(filters.priceTo)) {
      list = list.filter((d) => d.price <= (filters.priceTo as number));
    }

    if (filters.tags?.length) {
      const need = filters.tags.map((t) => t.toLowerCase());
      list = list.filter((d) =>
        (d.tags || []).some((tag) => need.includes(tag.toLowerCase()))
      );
    }

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      if (q) {
        list = list.filter((d) => {
          const hay = `${d.name} ${d.description ?? ""} ${(d.tags ?? []).join(
            " "
          )}`.toLowerCase();
          return hay.includes(q);
        });
      }
    }

    if (
      typeof filters.ratingFrom === "number" &&
      !Number.isNaN(filters.ratingFrom)
    ) {
      list = list.filter(
        (d) => (d.rating ?? 0) >= (filters.ratingFrom as number)
      );
    }

    if (filters.sort === "rating_desc")
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (filters.sort === "price_asc") list.sort((a, b) => a.price - b.price);
    if (filters.sort === "price_desc") list.sort((a, b) => b.price - a.price);

    const groups = buildGroups(list);
    setFilteredGroups(groups);

    if (filters.category) {
      const target = normalizeStr(filters.category);
      const groupKey = Object.keys(groups).find(
        (k) => normalizeStr(k) === target
      );
      if (groupKey) setOpenCategories({ [groupKey]: true });
      else setOpenCategories({});
    } else {
      const allOpen: Record<string, boolean> = {};
      Object.keys(groups).forEach((k) => (allOpen[k] = true));
      setOpenCategories(allOpen);
    }
  }, [allDishes, filters, buildGroups]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDishes({});
        const groups = buildGroups(data);
        setAllDishes(data);
        setCategoryGroups(groups);
        setFilteredGroups(groups);

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

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ✅ clear filters event from orchestrator
  useEffect(() => {
    const handler = () => {
      setCategory("all");
      setMaxPrice("");
      setSort("");
      setFilters({});
    };
    window.addEventListener("voiceFiltersClear", handler as EventListener);
    return () =>
      window.removeEventListener("voiceFiltersClear", handler as EventListener);
  }, []);

  // VOICE FILTERS
  useEffect(() => {
    const unsub = subscribeVoiceFilters((vf: VoiceFilters) => {
      const hasCategory =
        typeof vf.category === "string" && vf.category.trim().length > 0;

      const hasPrice =
        typeof vf.maxPrice === "number" && !Number.isNaN(vf.maxPrice);

      const hasTags = Array.isArray(vf.tags) && vf.tags.length > 0;

      const hasQuery =
        typeof vf.query === "string" && vf.query.trim().length > 0;

      const hasRating =
        typeof vf.ratingFrom === "number" && !Number.isNaN(vf.ratingFrom);

      const hasSort =
        vf.sort === "rating_desc" ||
        vf.sort === "price_asc" ||
        vf.sort === "price_desc";

      const onlyCategory =
        hasCategory &&
        !hasPrice &&
        !hasTags &&
        !hasQuery &&
        !hasRating &&
        !hasSort;

      if (hasCategory) {
        const label = pickCategoryLabelFromVoice(
          vf.category as string,
          categories,
          allDishes
        );
        if (label) {
          setCategory(label);
          setFilters((prev): MenuFilters => {
            if (onlyCategory) return { category: label };
            return { ...prev, category: label };
          });
          if (onlyCategory) {
            setMaxPrice("");
            setSort("");
          }
        }
      }

      if (hasPrice) {
        const vMax = Number(vf.maxPrice);
        setMaxPrice(String(vMax));
        setFilters((prev): MenuFilters => ({ ...prev, priceTo: vMax }));
      }

      if (hasSort) {
        const sortFromVoice = vf.sort as NonNullable<MenuFilters["sort"]>;
        setSort(
          sortFromVoice === "rating_desc"
            ? "-rating"
            : sortFromVoice === "price_asc"
            ? "price"
            : "-price"
        );
        setFilters((prev): MenuFilters => ({ ...prev, sort: sortFromVoice }));
      }

      if (hasTags)
        setFilters((prev): MenuFilters => ({ ...prev, tags: vf.tags }));

      if (hasQuery) {
        const q = (vf.query as string).trim();
        setFilters((prev): MenuFilters => ({ ...prev, query: q }));
      }

      if (hasRating) {
        const r = Number(vf.ratingFrom);
        setFilters((prev): MenuFilters => ({ ...prev, ratingFrom: r }));
      }
    });

    return () => unsub();
  }, [categories, allDishes]);

  const toggleCategoryOpen = (cat: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [cat]: !(prev[cat] ?? true),
    }));
  };

  const handleRowWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  const renderDishRows = () => {
    return Object.entries(filteredGroups).map(([cat, dishes]) => {
      const isOpen = openCategories[cat] ?? true;
      return (
        <div key={cat} className="category-block">
          <div
            className="category-header"
            onClick={() => toggleCategoryOpen(cat)}
          >
            <h3 className="category-title">{cat}</h3>
            <span className="category-toggle">{isOpen ? "▲" : "▼"}</span>
          </div>

          <div className={`category-row ${isOpen ? "open" : "closed"}`}>
            <div className="dish-row-scroll" onWheelCapture={handleRowWheel}>
              {dishes.map((dish) => (
                <div key={dish.id} className="dish-anim">
                  <DishCard dish={dish} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    });
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
          categories={categories}
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
            onClick={() => window.voiceStart?.()}
          >
            Голос
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => window.voiceStop?.()}
          >
            Стоп
          </button>
        </div>
        <WaiterWidget />
      </aside>
    </div>
  );
}
