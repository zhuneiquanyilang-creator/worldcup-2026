import { useEffect, useMemo, useState } from "react";
import type { TeamDetail } from "@/types/teamDetail";
import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";
import { loadOverrides } from "@/utils/teamDetailsOverrides";

/**
 * チーム詳細データ。`team_details.json` を元に localStorage の上書き（pastResults）をマージする。
 * 編集画面 (`/edit/history`) からの変更が同タブ内の表示に反映されるよう、
 * `storage` イベント + カスタムイベント `team-details-override-changed` を監視する。
 */
export function useTeamDetails() {
  const fileState = useJsonResource<TeamDetail[]>(dataUrl("team_details.json"));
  const [overrideVersion, setOverrideVersion] = useState(0);

  useEffect(() => {
    const bump = () => setOverrideVersion((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "wc2026:teamDetailsOverrides") bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("team-details-override-changed", bump);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("team-details-override-changed", bump);
    };
  }, []);

  return useMemo(() => {
    if (fileState.status !== "ready") return fileState;
    const overrides = loadOverrides();
    const merged: TeamDetail[] = fileState.data.map((d) => {
      const o = overrides[d.teamId];
      if (!o) return d;
      return { ...d, pastResults: o.pastResults ?? d.pastResults };
    });
    return { ...fileState, data: merged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileState, overrideVersion]);
}

export function useTeamDetailMap() {
  const state = useTeamDetails();
  const map = useMemo(() => {
    const m = new Map<string, TeamDetail>();
    if (state.status === "ready") {
      state.data.forEach((d) => m.set(d.teamId, d));
    }
    return m;
  }, [state]);
  return { ...state, map };
}
