import type { Dish } from "../types";

export const mockDishes: Dish[] = [
  // --- PIZZAS ---
  { id: 1, name: "Маргарита", description: "Піца з сиром та томатами", price: 180, category: "pizza", is_available: true, rating: 4.5, tags: ["vegetarian", "popular"], imageUrl: "" },
  { id: 2, name: "Пепероні", description: "Гостра піца з салямі", price: 210, category: "pizza", is_available: true, rating: 4.7, tags: ["spicy", "meat", "popular"], imageUrl: "" },
  { id: 3, name: "Гавайська", description: "Піца з ананасами та шинкою", price: 200, category: "pizza", is_available: true, rating: 4.1, tags: ["sweet", "meat"], imageUrl: "" },
  { id: 4, name: "4 Сири", description: "Класична сирна піца", price: 230, category: "pizza", is_available: true, rating: 4.8, tags: ["vegetarian", "popular"], imageUrl: "" },
  { id: 5, name: "Дьябло", description: "Дуже гостра піца", price: 240, category: "pizza", is_available: true, rating: 4.6, tags: ["spicy", "meat"], imageUrl: "" },

  // --- SOUPS ---
  { id: 6, name: "Борщ", description: "Класичний український борщ", price: 120, category: "soup", is_available: true, rating: 4.9, tags: ["meat", "popular"], imageUrl: "" },
  { id: 7, name: "Суп-пюре гарбузовий", description: "Ніжний гарбузовий суп", price: 110, category: "soup", is_available: true, rating: 4.3, tags: ["vegetarian", "light"], imageUrl: "" },
  { id: 8, name: "Том Ям", description: "Гострий тайський суп", price: 260, category: "soup", is_available: true, rating: 4.7, tags: ["spicy", "popular"], imageUrl: "" },
  { id: 9, name: "Курячий з локшиною", description: "Класичний суп з домашньою локшиною", price: 95, category: "soup", is_available: true, rating: 4.2, tags: ["light"], imageUrl: "" },
  { id: 10, name: "Окрошка", description: "Холодний літній суп", price: 90, category: "soup", is_available: true, rating: 4.0, tags: ["cold", "light"], imageUrl: "" },

  // --- SALADS ---
  { id: 11, name: "Цезар", description: "Салат з куркою", price: 150, category: "salad", is_available: true, rating: 4.8, tags: ["meat", "popular"], imageUrl: "" },
  { id: 12, name: "Грецький", description: "Овочевий салат з сиром фета", price: 130, category: "salad", is_available: true, rating: 4.4, tags: ["vegetarian", "light"], imageUrl: "" },
  { id: 13, name: "Олів’є", description: "Класичний салат", price: 95, category: "salad", is_available: true, rating: 4.5, tags: ["popular"], imageUrl: "" },
  { id: 14, name: "Теплий салат з яловичиною", description: "М'ясний салат", price: 170, category: "salad", is_available: true, rating: 4.6, tags: ["meat"], imageUrl: "" },
  { id: 15, name: "Салат з авокадо", description: "Легкий салат", price: 160, category: "salad", is_available: true, rating: 4.3, tags: ["vegetarian", "light"], imageUrl: "" },

  // --- DESSERTS ---
  { id: 16, name: "Шоколадний торт", description: "Солодкий десерт", price: 90, category: "dessert", is_available: true, rating: 4.9, tags: ["sweet", "popular"], imageUrl: "" },
  { id: 17, name: "Тірамісу", description: "Італійський десерт", price: 120, category: "dessert", is_available: true, rating: 4.8, tags: ["sweet"], imageUrl: "" },
  { id: 18, name: "Чізкейк", description: "Ніжний сирний десерт", price: 130, category: "dessert", is_available: true, rating: 4.7, tags: ["sweet"], imageUrl: "" },
  { id: 19, name: "Фруктовий салат", description: "Легкий десерт", price: 80, category: "dessert", is_available: true, rating: 4.3, tags: ["vegetarian", "light"], imageUrl: "" },

  // --- DRINKS ---
  { id: 20, name: "Кола", description: "Охолоджений напій", price: 40, category: "drink", is_available: true, rating: 4.2, tags: ["cold"], imageUrl: "" },
  { id: 21, name: "Охолоджений чай", description: "З льодом та лимоном", price: 45, category: "drink", is_available: true, rating: 4.4, tags: ["cold", "light"], imageUrl: "" },
  { id: 22, name: "Американо", description: "Чорна кава", price: 50, category: "drink", is_available: true, rating: 4.6, tags: ["popular"], imageUrl: "" },
  { id: 23, name: "Лате", description: "Кава з молоком", price: 65, category: "drink", is_available: true, rating: 4.7, tags: ["light"], imageUrl: "" },
  { id: 24, name: "Смузі манговий", description: "Солодкий освіжаючий", price: 85, category: "drink", is_available: true, rating: 4.8, tags: ["sweet", "cold"], imageUrl: "" }

]