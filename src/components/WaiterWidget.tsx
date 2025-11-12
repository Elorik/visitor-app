import { useEffect, useState } from "react";

type WaiterState = "idle" | "listening" | "speaking";

// Розширюємо Window для setWaiterState
declare global {
  interface Window {
    setWaiterState?: (state: WaiterState) => void;
  }
}

export function WaiterWidget() {
  const [state, setState] = useState<WaiterState>("idle");

  useEffect(() => {
    window.setWaiterState = (s: WaiterState) => setState(s);
  }, []);

  const text =
    state === "idle"
      ? "Офіціант готовий допомогти"
      : state === "listening"
      ? "Офіціант слухає замовлення..."
      : "Офіціант підказує страви...";

  return (
    <div className="waiter">
      <div
        style={{
          width: 70,
          height: 70,
          borderRadius: "50%",
          border: "3px solid var(--primary)",
          margin: "0 auto 8px",
          background:
            state === "listening"
              ? "var(--primary-soft)"
              : state === "speaking"
              ? "rgba(37,99,235,0.1)"
              : "transparent",
          transition: "background 0.3s ease",
        }}
      />
      <div style={{ textAlign: "center" }}>{text}</div>
    </div>
  );
}
