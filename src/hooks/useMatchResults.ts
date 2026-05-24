import { useJsonResource } from "./useJsonResource";
import { dataUrl } from "@/utils/dataUrl";
import type { LiveUpdate } from "@/types/live";

/**
 * `public/data/match_results.json` を読む。
 *
 * 公開サイト向けの確定結果ファイル。localStorage と同じ shape
 * (`Record<matchId, LiveUpdate>`) で、`useMatches` がマージする。
 * 編集は `/edit/matches` の UI から行い、エクスポートした JSON を
 * このファイルに貼り付けて commit する運用。
 */
export function useMatchResults() {
  return useJsonResource<Record<string, LiveUpdate>>(
    dataUrl("match_results.json")
  );
}
