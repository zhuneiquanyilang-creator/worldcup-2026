import type { PastResult } from "@/types/teamDetail";

const STORAGE_KEY = "wc2026:teamDetailsOverrides";

export type Overrides = Record<string, { pastResults?: PastResult[] }>;

export function loadOverrides(): Overrides {
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

export function saveOverrides(overrides: Overrides) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

export function setPastResults(teamId: string, results: PastResult[]) {
  const o = loadOverrides();
  o[teamId] = { ...(o[teamId] ?? {}), pastResults: results };
  saveOverrides(o);
}

export function clearOverrides() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
