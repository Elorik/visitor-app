import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { MenuPage } from "./pages/MenuPage";
import { AuthPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { ProfilePage } from "./pages/ProfilePage";
import { DishDetailsPage } from "./pages/DishDetailsPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./App.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<MenuPage />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="dish/:id" element={<DishDetailsPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  </React.StrictMode>
);
