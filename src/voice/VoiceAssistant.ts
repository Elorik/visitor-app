import type { VoiceFilters } from "../types";

type AssistantState = "idle" | "listening";

export interface AssistantOptions {
  lang?: string;
  onText?: (text: string) => void;
  onStateChange?: (s: AssistantState) => void;
}

const DEFAULT_LANG = "uk-UA";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
    applyVoiceFiltersFromVoice?: (vf: VoiceFilters) => void;
    __lastVoiceText?: string;
  }
}

export class VoiceAssistant {
  private recognition: any = null;
  private lang: string;
  private onText?: (text: string) => void;
  private onStateChange?: (s: AssistantState) => void;

  constructor(options?: AssistantOptions) {
    this.lang = options?.lang ?? DEFAULT_LANG;
    this.onText = options?.onText;
    this.onStateChange = options?.onStateChange;
    this.initRecognition();
  }

  private setWaiterState(s: "idle" | "listening") {
    try { if (window.setWaiterState) window.setWaiterState(s); } catch {}
    this.onStateChange?.(s);
  }

  private initRecognition() {
    const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Web Speech API не підтримується.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.lang;
    this.recognition.interimResults = false;
    this.recognition.continuous = false;

    this.recognition.onstart = () => this.setWaiterState("listening");
    this.recognition.onend = () => this.setWaiterState("idle");
    this.recognition.onerror = (ev: any) => { console.error("speech error", ev); this.setWaiterState("idle"); };

    this.recognition.onresult = (ev: any) => {
      const text = ev.results?.[0]?.[0]?.transcript?.trim() ?? "";
      if (!text) {
        this.setWaiterState("idle");
        return;
      }
      this.onText?.(text);
      window.__lastVoiceText = text;
      this.processRecognizedText(text.toLowerCase());
    };
  }

  start() {
    if (!this.recognition) this.initRecognition();
    try {
      this.recognition?.start();
      this.setWaiterState("listening");
    } catch (e) {
      console.error("start recognition error", e);
    }
  }

  stop() {
    try {
      this.recognition?.stop();
    } catch (e) {
      console.error("stop recognition error", e);
    } finally {
      this.setWaiterState("idle");
    }
  }

  private sendFiltersToFrontend(filters: VoiceFilters) {
    try {
      if (typeof window.applyVoiceFiltersFromVoice === "function") {
        window.applyVoiceFiltersFromVoice(filters);
      } else {
        window.dispatchEvent(new CustomEvent("voiceFilters", { detail: filters }));
      }
    } catch (e) {
      console.error("sendFiltersToFrontend error", e);
    }
  }

  private processRecognizedText(text: string) {
    const parsed = parseCommandToFilters(text);
    if (parsed) {
      this.sendFiltersToFrontend(parsed);
    } else if (text.includes("порада") || text.includes("рекомендуй") || text.includes("популяр")) {
      this.sendFiltersToFrontend({ category: null, maxPrice: null, tags: ["popular"] });
    }
  }
}

/* ----------------- парсинг команд ----------------- */

export function parseCommandToFilters(text: string): VoiceFilters | null {
  const t = text.toLowerCase();
  const category = extractCategoryFromText(t);
  const maxPrice = extractPriceFromText(t);
  const tags: string[] = [];

  if (t.includes("гостр") || t.includes("пікант")) tags.push("spicy");
  if (t.includes("солод") || t.includes("десерт")) tags.push("sweet");
  if (t.includes("вегет")) tags.push("vegetarian");
  if (t.includes("популяр") || t.includes("рекоменд")) tags.push("popular");

  if (!category && !maxPrice && tags.length === 0) return null;
  return { category, maxPrice, tags };
}

function extractCategoryFromText(t: string): string | null {
  if (!t) return null;
  if (t.includes("піц") || t.includes("піца")) return "pizza";
  if (t.includes("суп")) return "soup";
  if (t.includes("салат")) return "salad";
  if (t.includes("десерт") || t.includes("десерти")) return "dessert";
  return null;
}

function extractPriceFromText(t: string): number | null {
  if (!t) return null;
  const m = t.match(/(?:до|менш(?:е|ий)?)\s*([0-9]{1,5})/);
  if (m && m[1]) return Number(m[1]);
  const m2 = t.match(/([0-9]{1,5})\s*(грив|грн|uah)/);
  if (m2 && m2[1]) return Number(m2[1]);
  return null;
}