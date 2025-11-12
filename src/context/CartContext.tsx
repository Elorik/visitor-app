/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Dish } from "../types";

interface CartItem {
  dish: Dish;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  add: (dish: Dish) => void;
  remove: (dishId: number) => void;
  changeQty: (dishId: number, qty: number) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (dish: Dish) => {
    setItems((prev) => {
      const exist = prev.find((i) => i.dish.id === dish.id);
      if (exist) {
        return prev.map((i) =>
          i.dish.id === dish.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { dish, quantity: 1 }];
    });
  };

  const remove = (dishId: number) => {
    setItems((prev) => prev.filter((i) => i.dish.id !== dishId));
  };

  const changeQty = (dishId: number, qty: number) => {
    if (qty <= 0) {
      remove(dishId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.dish.id === dishId ? { ...i, quantity: qty } : i))
    );
  };

  const clear = () => setItems([]);

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.dish.price * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, add, remove, changeQty, clear, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
