import type { LiveUpdate } from "@/types/live";

const STORAGE_KEY = "wc2026:matchOverrides";
const EVENT_NAME = "match-overrides-changed";

export type MatchOverrides = Record<string, LiveUpdate>;

export function loadMatchOverrides(): MatchOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMatchOverrides(o: MatchOverrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function setMatchOverride(matchId: string, update: LiveUpdate) {
  const o = loadMatchOverrides();
  o[matchId] = { ...(o[matchId] ?? { matchId }), ...update };
  saveMatchOverrides(o);
}

export function clearMatchOverride(matchId: string) {
  const o = loadMatchOverrides();
  if (matchId in o) {
    delete o[matchId];
    saveMatchOverrides(o);
  }
}

export function clearAllMatchOverrides() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export const MATCH_OVERRIDES_EVENT = EVENT_NAME;
