// FILE: src/voice/VoiceIntegration.ts
import type { VoiceFilters } from "../types";

export type VoiceState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export type VoiceAction =
  | { type: "stop_all" }
  | { type: "help" }
  | { type: "navigate"; path: string }
  | { type: "checkout_open" }
  | { type: "checkout_confirm" }
  | { type: "cart_clear" }
  | { type: "cart_add"; name: string }
  | { type: "cart_remove"; name: string }
  | { type: "filters_clear" };

type FiltersCb = (vf: VoiceFilters) => void;
type ActionCb = (a: VoiceAction) => void;
type StateCb = (s: VoiceState) => void;
type TextCb = (t: string) => void;

let filtersCbs: FiltersCb[] = [];
let actionCbs: ActionCb[] = [];
let stateCbs: StateCb[] = [];
let textCbs: TextCb[] = [];

export function subscribeVoiceFilters(cb: FiltersCb) {
  filtersCbs.push(cb);
  return () => {
    filtersCbs = filtersCbs.filter((x) => x !== cb);
  };
}

export function subscribeVoiceActions(cb: ActionCb) {
  actionCbs.push(cb);
  return () => {
    actionCbs = actionCbs.filter((x) => x !== cb);
  };
}

export function subscribeVoiceState(cb: StateCb) {
  stateCbs.push(cb);
  return () => {
    stateCbs = stateCbs.filter((x) => x !== cb);
  };
}

export function subscribeVoiceText(cb: TextCb) {
  textCbs.push(cb);
  return () => {
    textCbs = textCbs.filter((x) => x !== cb);
  };
}

export function emitVoiceFilters(vf: VoiceFilters) {
  for (const cb of filtersCbs) {
    try {
      cb(vf);
    } catch (e) {
      console.error("voice filters callback error", e);
    }
  }
}

export function emitVoiceAction(a: VoiceAction) {
  for (const cb of actionCbs) {
    try {
      cb(a);
    } catch (e) {
      console.error("voice action callback error", e);
    }
  }
}

export function emitVoiceState(s: VoiceState) {
  for (const cb of stateCbs) {
    try {
      cb(s);
    } catch (e) {
      console.error("voice state callback error", e);
    }
  }
}

export function emitVoiceText(t: string) {
  for (const cb of textCbs) {
    try {
      cb(t);
    } catch (e) {
      console.error("voice text callback error", e);
    }
  }
}
