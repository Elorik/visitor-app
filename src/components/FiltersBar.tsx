interface Props {
  categories: string[];
  category: string;
  setCategory: (v: string) => void;
  maxPrice: string;
  setMaxPrice: (v: string) => void;
  sort: string;
  setSort: (v: string) => void;
}

export function FiltersBar({
  categories,
  category,
  setCategory,
  maxPrice,
  setMaxPrice,
  sort,
  setSort,
}: Props) {
  return (
    <div className="filters">
      <select
        className="input"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
      >
        <option value="all">Усі категорії</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        className="input"
        type="number"
        placeholder="Макс. ціна"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
      />

      <select
        className="input"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="">Без сортування</option>
        <option value="-rating">За рейтингом</option>
        <option value="price">Ціна ↑</option>
        <option value="-price">Ціна ↓</option>
      </select>
    </div>
  );
}
