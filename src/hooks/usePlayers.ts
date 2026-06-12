import { useEffect, useMemo, useState } from "react";
import type { Player } from "@/types/player";
import { useTeams } from "./useTeams";
import { dataUrl } from "@/utils/dataUrl";

/**
 * 全 48 か国の選手データを取得する。
 *
 * `public/data/players/{teamId}.json` を `teams.json` の一覧をもとに並列 fetch し、
 * 1 つの `Player[]` に concat して返す。1 か国でも fetch に失敗したら error 扱い。
 *
 * 旧構造: 全選手を 1 つの `public/data/players.json` に持っていた。
 * ファイルが 1248 行を超えて差分管理しにくかったので per-team に分割。
 */
type State =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: Player[]; error: null }
  | { status: "error"; data: null; error: string };

export function usePlayers(): State {
  const teamsState = useTeams();
  const [state, setState] = useState<State>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    if (teamsState.status === "loading") {
      setState({ status: "loading", data: null, error: null });
      return;
    }
    if (teamsState.status === "error") {
      setState({ status: "error", data: null, error: teamsState.error });
      return;
    }
    let cancelled = false;
    setState({ status: "loading", data: null, error: null });
    (async () => {
      try {
        const results = await Promise.all(
          teamsState.data.map(async (t) => {
            const url = dataUrl(`players/${t.id}.json`);
            const r = await fetch(url);
            if (!r.ok) throw new Error(`${t.id}: ${r.status} ${r.statusText}`);
            return (await r.json()) as Player[];
          })
        );
        if (cancelled) return;
        setState({ status: "ready", data: results.flat(), error: null });
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        setState({ status: "error", data: null, error: message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamsState]);

  return state;
}

export function usePlayerMap() {
  const state = usePlayers();
  const map = useMemo(() => {
    const m = new Map<string, Player>();
    if (state.status === "ready") {
      state.data.forEach((p) => m.set(p.id, p));
    }
    return m;
  }, [state]);
  return { ...state, map };
}
