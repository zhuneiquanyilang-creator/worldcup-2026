import type { LiveUpdate } from "@/types/live";

/**
 * 手動編集の試合結果 (公式結果) を localStorage に保存する。
 *
 * `matchOverrides.ts` が Sofascore ライブ取得用のレイヤーなのに対し、
 * こちらは `/edit/matches` の編集 UI 専用。auto-sync (`useAutoSyncResults`)
 * は **このレイヤーだけ** を `public/data/match_results.json` に書き出す
 * ので、ライブ取得結果が誤って公式記録に流れ込むことはない。
 *
 * 表示優先順位 (`useMatches`):
 *   matches.json → match_results.json (file) → matchOverrides (live) → matchEdits (manual)
 * matchEdits が最優先で、手動で確定した結果はライブ更新で上書きされない。
 */

const STORAGE_KEY = "wc2026:matchEdits";
const EVENT_NAME = "match-edits-changed";

export type MatchEdits = Record<string, LiveUpdate>;

export function loadMatchEdits(): MatchEdits {
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

export function saveMatchEdits(o: MatchEdits) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(o));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function setMatchEdit(matchId: string, update: LiveUpdate) {
  const o = loadMatchEdits();
  o[matchId] = { ...(o[matchId] ?? { matchId }), ...update };
  saveMatchEdits(o);
}

export function clearMatchEdit(matchId: string) {
  const o = loadMatchEdits();
  if (matchId in o) {
    delete o[matchId];
    saveMatchEdits(o);
  }
}

export function clearAllMatchEdits() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export const STORAGE_KEY_MATCH_EDITS = STORAGE_KEY;
export const MATCH_EDITS_EVENT = EVENT_NAME;
