/// FILE: src/components/WaiterWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { WaiterState } from "../types/waiter";

import introVideo from "../assets/cup_intro.webm?url";
import idleVideo from "../assets/cup_idle.webm?url";
import listeningVideo from "../assets/cup_listening.webm?url";
import speakingVideo from "../assets/cup_speaking.webm?url";

declare global {
  interface Window {
    setWaiterState?: (state: WaiterState) => void;
    getWaiterState?: () => WaiterState;
  }
}

export function WaiterWidget() {
  const [state, setState] = useState<WaiterState>("intro");
  const stateRef = useRef<WaiterState>("intro");
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    window.setWaiterState = (s: WaiterState) => setState(s);
    window.getWaiterState = () => stateRef.current;

    return () => {
      delete window.setWaiterState;
      delete window.getWaiterState;
    };
  }, []);

  const videoSrc = useMemo(() => {
    if (state === "intro") return introVideo;
    if (state === "speaking") return speakingVideo;
    if (state === "listening") return listeningVideo;
    if (state === "thinking") return listeningVideo;
    return idleVideo;
  }, [state]);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const safePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  const playLoop = (delayMs: number) => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      if (stateRef.current !== state) return;
      safePlay();
    }, delayMs);
  };

  // КЛЮЧОВЕ: при зміні src — робимо load(), потім play()
  useEffect(() => {
    clearTimer();

    const v = videoRef.current;
    if (!v) return;

    try {
      v.pause();
      v.removeAttribute("src"); // скидає декодер/кадри
      v.load();

      v.src = videoSrc;
      v.load(); // примусово перечитати src

      v.currentTime = 0;
      const p = v.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [videoSrc]);

  const handleVideoEnd = () => {
    const s = stateRef.current;

    if (s === "intro") {
      setState("idle");
      return;
    }

    if (s === "idle") playLoop(2500);
    if (s === "listening" || s === "thinking") playLoop(250);

    // speaking: loop атрибутом, тут не чіпаємо
    if (s === "error") playLoop(1200);
  };

  const text =
    state === "intro"
      ? "Привіт! Я тут, щоб допомогти"
      : state === "idle"
      ? "Офіціант готовий допомогти"
      : state === "listening"
      ? "Слухаю..."
      : state === "thinking"
      ? "Думаю..."
      : state === "error"
      ? "Не зрозумів"
      : "Підказує...";

  return (
    <div className="waiter">
      <div className="waiter-avatar">
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          loop={state === "speaking"}
          onEnded={handleVideoEnd}
          className={`waiter-video ${state}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="waiter-text">{text}</div>
    </div>
  );
}
