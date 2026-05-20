import { useMemo } from "react";
import type { Team } from "@/types/team";
import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";

export function useTeams() {
  return useJsonResource<Team[]>(dataUrl("teams.json"));
}

export function useTeamMap() {
  const state = useTeams();
  const map = useMemo(() => {
    const m = new Map<string, Team>();
    if (state.status === "ready") {
      state.data.forEach((t) => m.set(t.id, t));
    }
    return m;
  }, [state]);
  return { ...state, map };
}
