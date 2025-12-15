// FILE: src/voice/VoiceAssistant.ts
import type { VoiceFilters } from "../types";
import type { WaiterState } from "../types/waiter";
import {
  emitVoiceAction,
  emitVoiceFilters,
  emitVoiceState,
  emitVoiceText,
  type VoiceAction,
  type VoiceState,
} from "./VoiceIntegration";

const DEFAULT_LANG = "uk-UA";

type SpeechRecognitionResultLike = { transcript?: string };
type SpeechRecognitionAlternativeListLike = { 0?: SpeechRecognitionResultLike };
type SpeechRecognitionResultListLike = {
  0?: SpeechRecognitionAlternativeListLike;
};
type SpeechRecognitionEventLike = { results?: SpeechRecognitionResultListLike };

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;

  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;

  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionCtor;
    SpeechRecognition?: SpeechRecognitionCtor;

    setWaiterState?: (state: WaiterState) => void;

    // глобальні керування
    voiceStart?: () => void;
    voiceStop?: () => void;
    voiceSay?: (text: string) => void;

    __lastVoiceText?: string;
  }
}

type AssistantOptions = { lang?: string };

function normalize(s: string) {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[’'`]/g, "")
    .replace(/\s+/g, " ");
}

export class VoiceAssistant {
  private recognition: SpeechRecognitionLike | null = null;
  private lang: string;

  private armed = false; // “режим голосу увімкнений”
  private speaking = false; // зараз TTS
  private restarting = false; // щоб не піймати спам стартів

  constructor(options?: AssistantOptions) {
    this.lang = options?.lang ?? DEFAULT_LANG;
    this.initRecognition();

    window.voiceStart = () => this.start();
    window.voiceStop = () => this.stop();
    window.voiceSay = (text: string) => this.reply(text);
  }

  private setWaiterFromVoiceState(s: VoiceState) {
    const w: WaiterState =
      s === "speaking" ? "speaking" : s === "listening" ? "listening" : "idle";
    try {
      window.setWaiterState?.(w);
    } catch {
      // ignore
    }
  }

  private setState(s: VoiceState) {
    this.setWaiterFromVoiceState(s);
    emitVoiceState(s);
  }

  private initRecognition() {
    const Ctor = window.webkitSpeechRecognition ?? window.SpeechRecognition;
    if (!Ctor) {
      console.warn("Web Speech API не підтримується.");
      return;
    }

    const rec = new Ctor();
    rec.lang = this.lang;
    rec.interimResults = false;
    rec.continuous = false;

    rec.onstart = () => this.setState("listening");

    rec.onend = () => {
      // якщо зараз іде TTS — не перебивай speaking
      if (this.speaking) {
        this.setState("speaking");
        return;
      }
      this.setState("idle");
      this.maybeRestart();
    };

    rec.onerror = () => {
      // якщо зараз іде TTS — не перебивай speaking
      if (this.speaking) {
        this.setState("speaking");
        return;
      }
      this.setState("error");
      this.maybeRestart();
    };

    rec.onresult = (ev: SpeechRecognitionEventLike) => {
      const raw = ev.results?.[0]?.[0]?.transcript?.trim() ?? "";
      const text = normalize(raw);
      if (!text) return;

      window.__lastVoiceText = text;
      emitVoiceText(text);

      this.stopSpeaking();
      this.setState("thinking");

      const intent = parseVoice(text);

      if (intent.kind === "action") {
        // ✅ multi-add / multi-remove: шлемо кілька action’ів
        for (const a of intent.actions) emitVoiceAction(a);

        // Відповіді “додав/видалив” каже orchestrator (бо він знає факт успіху).
        if (intent.reply) this.reply(intent.reply);
        else this.setState("idle");

        return;
      }

      if (intent.kind === "filters") {
        emitVoiceFilters(intent.filters);
        if (intent.reply) this.reply(intent.reply);
        else this.setState("idle");
        return;
      }

      this.setState("error");
      this.reply("Не зрозумів команду. Скажи: чіткіше.");
    };

    this.recognition = rec;
  }

  start() {
    this.armed = true;
    this.stopSpeaking();

    try {
      this.recognition?.start();
    } catch {
      // якщо start викликали двічі поспіль — ігноруємо
    }
  }

  stop() {
    this.armed = false;

    try {
      this.recognition?.stop();
    } catch {
      // ignore
    }

    this.stopSpeaking();
    this.setState("idle");
  }

  private maybeRestart() {
    if (!this.armed) return;
    if (this.speaking) return;
    if (!this.recognition) return;
    if (this.restarting) return;

    this.restarting = true;
    window.setTimeout(() => {
      this.restarting = false;
      if (!this.armed) return;
      if (this.speaking) return;
      try {
        this.recognition?.start();
      } catch {
        // ignore
      }
    }, 250);
  }

  private reply(text: string) {
    const t = normalize(text);
    if (!t) {
      this.setState("idle");
      this.maybeRestart();
      return;
    }
    this.speak(t);
  }

  private speak(text: string) {
    if (!("speechSynthesis" in window)) {
      this.setState("idle");
      this.maybeRestart();
      return;
    }

    try {
      this.speaking = true;
      this.setState("speaking");

      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.lang;

      u.onend = () => {
        this.speaking = false;
        this.setState("idle");
        this.maybeRestart();
      };

      u.onerror = () => {
        this.speaking = false;
        this.setState("error");
        this.maybeRestart();
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      this.speaking = false;
      this.setState("idle");
      this.maybeRestart();
    }
  }

  private stopSpeaking() {
    try {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    this.speaking = false;
    this.setState("idle");
  }
}

/* ---------------------- PARSER ---------------------- */

type ParseResult =
  | { kind: "filters"; filters: VoiceFilters; reply: string }
  | { kind: "action"; actions: VoiceAction[]; reply: string }
  | { kind: "unknown" };

function parseVoice(text: string): ParseResult {
  const t = normalize(text);

  // stop / cancel
  if (/(стоп|зупини|скасуй|відміни|cancel|stop)/.test(t)) {
    return {
      kind: "action",
      actions: [{ type: "stop_all" }],
      reply: "Зупиняю.",
    };
  }

  // help
  if (/(допоможи|що ти вмієш|help)/.test(t)) {
    return {
      kind: "action",
      actions: [{ type: "help" }],
      reply:
        "Можу фільтрувати меню, відкривати сторінки, працювати з кошиком і підтверджувати замовлення.",
    };
  }

  // clear filters (✅ окремий action)
  if (
    /(скинь фільтр|очисти фільтр|clear filters|reset filters|скинь фільтри)/.test(
      t
    )
  ) {
    return {
      kind: "action",
      actions: [{ type: "filters_clear" }],
      reply: "Скидаю фільтри.",
    };
  }

  // navigation
  if (/(відкрий|перейди|open|go to)/.test(t)) {
    if (/(меню|menu)/.test(t)) return nav("/menu", "Відкриваю меню.");
    if (/(кошик|cart)/.test(t)) return nav("/cart", "Відкриваю кошик.");
    if (/(профіль|кабінет|profile|account)/.test(t))
      return nav("/profile", "Відкриваю кабінет.");
    if (/(адмін|admin)/.test(t))
      return nav("/admin", "Відкриваю адмін панель.");
    if (/(головн|home)/.test(t)) return nav("/", "Відкриваю головну.");
    if (/(оформ|checkout)/.test(t)) {
      return {
        kind: "action",
        actions: [{ type: "checkout_open" }],
        reply: "Переходжу до оформлення.",
      };
    }
  }

  // checkout confirm
  if (/(підтверд|підтверджую|оформи|замовляю|confirm|place order)/.test(t)) {
    return {
      kind: "action",
      actions: [{ type: "checkout_confirm" }],
      reply: "",
    };
  }

  // cart clear
  if (/(очисти кошик|clear cart)/.test(t)) {
    return {
      kind: "action",
      actions: [{ type: "cart_clear" }],
      reply: "Очищаю кошик.",
    };
  }

  // cart add/remove multi
  if (/(додай|додати|add)/.test(t) && /(кошик|cart)/.test(t)) {
    const names = extractNamesAfterVerb(t, ["додай", "додати", "add"]);
    if (names.length) {
      return {
        kind: "action",
        actions: names.map((name) => ({ type: "cart_add", name })),
        reply: "",
      };
    }
  }

  if (/(прибери|видали|remove|delete)/.test(t) && /(кошик|cart)/.test(t)) {
    const names = extractNamesAfterVerb(t, [
      "прибери",
      "видали",
      "remove",
      "delete",
    ]);
    if (names.length) {
      return {
        kind: "action",
        actions: names.map((name) => ({ type: "cart_remove", name })),
        reply: "",
      };
    }
  }

  // filters
  const filters = parseFilters(t);
  if (filters)
    return { kind: "filters", filters, reply: "Застосовую фільтри." };

  return { kind: "unknown" };
}

function nav(path: string, reply: string): ParseResult {
  return { kind: "action", actions: [{ type: "navigate", path }], reply };
}

function extractNamesAfterVerb(t: string, verbs: string[]) {
  // "додай X і Y в кошик" -> ["x", "y"]
  // "add x, y to cart" -> ["x","y"]
  const v = verbs.find((x) => t.startsWith(x + " "));
  if (!v) return [];

  let rest = t.slice(v.length).trim();

  rest = rest.replace(/^(мені|будь ласка)\s+/g, "");
  rest = rest.replace(/\s+(в|у)\s+(кошик|cart).*$/g, "");
  rest = rest.replace(/\s+(з|із)\s+(кошика|cart).*$/g, "");
  rest = rest.replace(/\s+from\s+cart.*$/g, "");
  rest = rest.replace(/\s+to\s+cart.*$/g, "");
  rest = rest.replace(/[.!,?]+$/g, "").trim();

  if (!rest) return [];

  // split by "і/та/and", commas
  const parts = rest
    .split(/\s*(?:і|та|and|,|\+)\s*/g)
    .map((x) => x.trim())
    .filter(Boolean);

  return parts;
}

/* ---------- FILTERS ---------- */

function parseFilters(t: string): VoiceFilters | null {
  const category = extractCategoryFromText(t);
  const maxPrice = extractMaxPrice(t);
  const tags = extractTagsFromText(t);
  const query = extractQuery(t);
  const ratingFrom = extractRating(t);
  const sort = extractSort(t);

  const has =
    !!category ||
    typeof maxPrice === "number" ||
    tags.length > 0 ||
    !!query ||
    typeof ratingFrom === "number" ||
    !!sort;

  if (!has) return null;

  return {
    category,
    maxPrice: typeof maxPrice === "number" ? maxPrice : null,
    tags,
    query: query ?? null,
    ratingFrom: typeof ratingFrom === "number" ? ratingFrom : null,
    sort: sort ?? null,
  };
}

function extractCategoryFromText(txt: string): string | null {
  const t = normalize(txt);

  if (/(піц|пиц|pizza)/.test(t)) return "pizza";
  if (/(суп|борщ|бульйон|soup)/.test(t)) return "soup";
  if (/(салат|salad)/.test(t)) return "salad";
  if (/(десерт|солодк|торт|тіраміс|dessert|sweet)/.test(t)) return "dessert";
  if (/(нап|пит|кава|чай|drink|drinks)/.test(t)) return "drink";

  return null;
}

function extractMaxPrice(t: string): number | null {
  const m1 = t.match(/(?:до|менше)\s*(\d{1,5})/);
  if (m1) return Number(m1[1]);
  const m2 = t.match(/(?:under|less than)\s*(\d{1,5})/);
  if (m2) return Number(m2[1]);
  return null;
}

function extractRating(t: string): number | null {
  const m1 = t.match(/(?:рейтинг\s*від|від)\s*(\d(?:[.,]\d)?)/);
  if (m1) return Number(m1[1].replace(",", "."));
  const m2 = t.match(/rating\s*(\d(?:[.,]\d)?)/);
  if (m2) return Number(m2[1].replace(",", "."));
  return null;
}

function extractSort(
  t: string
): "rating_desc" | "price_asc" | "price_desc" | null {
  if (/(найпопуляр|топ|best|popular|рекоменд)/.test(t)) return "rating_desc";
  if (/(дешевш|за ціною зрост|price asc|cheapest)/.test(t)) return "price_asc";
  if (/(дорожч|за ціною спад|price desc|most expensive)/.test(t))
    return "price_desc";
  if (/(за рейтингом|rating)/.test(t)) return "rating_desc";
  return null;
}

function extractQuery(t: string): string | null {
  const m = t.match(/(?:знайди|покажи|show|find)\s+(.+)$/);
  if (!m) return null;

  const q = m[1]
    .replace(/\s+(до|менше|under|less than)\s+\d{1,5}.*$/g, "")
    .replace(/\s+(в|у)\s+(кошик|cart).*$/g, "")
    .replace(/[.!,?]+$/g, "")
    .trim();

  if (!q) return null;

  if (
    /(піц|пиц|pizza|суп|soup|салат|salad|десерт|dessert|drink|напій|кава|чай)/.test(
      q
    )
  )
    return null;

  return q;
}

function extractTagsFromText(t: string): string[] {
  const tags: string[] = [];
  const map: Array<[RegExp, string]> = [
    [/(гостр|пікант|остр|spicy)/, "spicy"],
    [/(солод|dessert|sweet|торт|тіраміс)/, "sweet"],
    [/(вегет|веган|vegetarian|vegan)/, "vegetarian"],
    [/(легк|light)/, "light"],
    [/(мяс|м'яс|курк|ялович|свин|meat|chicken|beef|pork)/, "meat"],
    [/(великий|велика порція|big)/, "big"],
    [/(холод|з льодом|cold|ice)/, "cold"],
  ];
  for (const [re, key] of map) {
    if (re.test(t) && !tags.includes(key)) tags.push(key);
  }
  return tags;
}
