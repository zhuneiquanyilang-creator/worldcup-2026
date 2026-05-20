import { useMemo } from "react";
import type { Player } from "@/types/player";
import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";

export function usePlayers() {
  return useJsonResource<Player[]>(dataUrl("players.json"));
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
