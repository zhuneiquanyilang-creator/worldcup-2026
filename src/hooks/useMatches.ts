import { useEffect, useMemo, useState } from "react";
import type { Match } from "@/types/match";
import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";
import {
  MATCH_OVERRIDES_EVENT,
  loadMatchOverrides,
} from "@/utils/matchOverrides";

/**
 * `matches.json` を読み、localStorage の上書き (ライブデータ) を上に重ねて返す。
 * 上書きは部分マージ: 既存フィールドを保持しつつ、updateにあるフィールドだけ差し替え。
 * 例外: goals/bookings/substitutions は配列全体を置き換え (差分マージは複雑なため)。
 */
export function useMatches() {
  const fileState = useJsonResource<Match[]>(dataUrl("matches.json"));
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key === "wc2026:matchOverrides") bump();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(MATCH_OVERRIDES_EVENT, bump);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(MATCH_OVERRIDES_EVENT, bump);
    };
  }, []);

  return useMemo(() => {
    if (fileState.status !== "ready") return fileState;
    const overrides = loadMatchOverrides();
    const merged: Match[] = fileState.data.map((m) => {
      const o = overrides[m.id];
      if (!o) return m;
      return {
        ...m,
        ...(o.status ? { status: o.status } : {}),
        ...(o.liveLabel ? { liveLabel: o.liveLabel } : {}),
        ...(o.score ? { score: o.score } : {}),
        ...(o.goals ? { goals: o.goals } : {}),
        ...(o.bookings ? { bookings: o.bookings } : {}),
        ...(o.substitutions ? { substitutions: o.substitutions } : {}),
        ...(o.homeFormation ? { homeFormation: o.homeFormation } : {}),
        ...(o.awayFormation ? { awayFormation: o.awayFormation } : {}),
        ...(o.stats ? { stats: o.stats } : {}),
      };
    });
    return { ...fileState, data: merged };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileState, version]);
}
