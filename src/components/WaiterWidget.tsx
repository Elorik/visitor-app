// FILE: src/components/WaiterWidget.tsx
import { useEffect, useMemo, useRef, useState } from "react";

import introVideo from "../assets/cup_intro.webm?url";
import idleVideo from "../assets/cup_idle.webm?url";
import listeningVideo from "../assets/cup_listening.webm?url";
import speakingVideo from "../assets/cup_speaking.webm?url";

export type WaiterState =
  | "intro"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

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

    // thinking/error без нових відео: thinking як listening, error як idle
    if (state === "thinking") return listeningVideo;
    return idleVideo;
  }, [state]);

  const playLoop = (delayMs: number) => {
    window.setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      if (stateRef.current !== state) return;

      try {
        v.currentTime = 0;
        void v.play();
      } catch {
        // ignore
      }
    }, delayMs);
  };

  const handleVideoEnd = () => {
    const s = stateRef.current;

    if (s === "intro") {
      setState("idle");
      return;
    }

    if (s === "idle") playLoop(2500);
    if (s === "listening" || s === "thinking") playLoop(250);

    // speaking/error — не лупимо агресивно
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
          key={videoSrc}
          src={videoSrc}
          autoPlay
          muted
          playsInline
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
