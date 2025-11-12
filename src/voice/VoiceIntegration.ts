import type { VoiceFilters } from "../types";

let callbacks: Array<(vf: VoiceFilters) => void> = [];

// Публічний інтерфейс для інших модулів фронта
export function subscribeVoiceFilters(cb: (vf: VoiceFilters) => void) {
  callbacks.push(cb);
  return () => {
    callbacks = callbacks.filter((fn) => fn !== cb);
  };
}

// Розширюємо тип вікна замість any
declare global {
  interface Window {
    applyVoiceFiltersFromVoice?: (vf: VoiceFilters) => void;
  }
}

// Викликатиме модуль Нечипора
window.applyVoiceFiltersFromVoice = (vf: VoiceFilters) => {
  callbacks.forEach((cb) => cb(vf));
};
