import { useEffect, useState } from "react";

type WaiterState = "idle" | "listening" | "speaking";

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
      <div className="waiter-avatar">
        <div className={`waiter-circle ${state}`}>
          <div className="waiter-face">
            <div className="waiter-eyes">
              <span />
              <span />
            </div>
            <div className="waiter-mouth" />
          </div>
        </div>
      </div>
      <div className="waiter-text">{text}</div>
    </div>
  );
}
