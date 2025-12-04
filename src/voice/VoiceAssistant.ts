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

  private setWaiterState(s: AssistantState) {
    try { window.setWaiterState?.(s); } catch {}
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
    this.recognition.onerror = () => this.setWaiterState("idle");

    this.recognition.onresult = (ev: any) => {
      const text = ev.results?.[0]?.[0]?.transcript?.trim() ?? "";
      if (!text) return;

      const lower = text.toLowerCase();
      this.onText?.(lower);
      window.__lastVoiceText = lower;

      const parsed = parseCommandToFilters(lower);

      if (parsed) {
        this.sendFiltersToFrontend(parsed);
      }
    };
  }

  start() {
    try { this.recognition?.start(); } catch {}
  }

  stop() {
    try { this.recognition?.stop(); } catch {}
    this.setWaiterState("idle");
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
}

/* ---------------------- PARSER ---------------------- */

export function parseCommandToFilters(text: string): VoiceFilters | null {
  const category = extractCategoryFromText(text);
  const maxPrice = extractPriceFromText(text);
  const tags = extractTagsFromText(text);

  if (!category && !maxPrice && tags.length === 0) return null;

  return { category, maxPrice, tags };
}

/* --- Categories --- */
function extractCategoryFromText(t: string): string | null {
  if (t.includes("піц")) return "pizza";
  if (t.includes("суп")) return "soup";
  if (t.includes("салат")) return "salad";
  if (t.includes("десерт") || t.includes("солодке")) return "dessert";
  if (t.includes("напій") || t.includes("пити") || t.includes("пити щось") || t.includes("напої"))  return "drink";
  return null;
}

/* --- Price --- */
function extractPriceFromText(t: string): number | null {
  const match = t.match(/(?:до|менше)\s*(\d{1,5})/);
  if (match) return Number(match[1]);
  return null;
}

/* --- Tags --- */
function extractTagsFromText(t: string): string[] {
  const tags: string[] = [];
  const txt = t.toLowerCase();

  // мапа ключових слів -> canonical tag
  const map: Array<[RegExp, string]> = [
    [/(гостр|пікант|остр)/, "spicy"],
    [/(солод|десерт|торт|тіраміс)/, "sweet"],
    [/(вегет|веган)/, "vegetarian"],
    [/(легк|легкий|легке)/, "light"],
    [/(\bм'яс|мяс|курк|ялович|свин)/, "meat"],
    [/(великий|велика порція|багато)/, "big"],
    [/(холод|охолодж|з льодом|ледь)/, "cold"],
    [/(популяр|recommend|рекоменд)/, "popular"],
  ];

  for (const [re, key] of map) {
    if (re.test(txt) && !tags.includes(key)) tags.push(key);
  }

  return tags;
}