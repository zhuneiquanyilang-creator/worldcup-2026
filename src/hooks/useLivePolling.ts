import { useEffect, useRef } from "react";
import type { Match } from "@/types/match";
import { isLive } from "@/utils/matchTiming";
import { setMatchOverride } from "@/utils/matchOverrides";
import { getLiveSource } from "@/services/liveSource";

const POLL_INTERVAL_MS = 60_000; // 1分

/**
 * 1分毎に「現在ライブ中の試合」を検出し、それぞれの最新情報を外部ソースから取得して
 * localStorage にオーバーレイ保存する。
 *
 * - 取得対象: `isLive(match)` が true のもののみ
 * - ライブ中の試合が無いときは何もしない
 * - 取得結果が null の場合はスキップ (上書きしない)
 * - 初回 fetch は matches が読み込まれた直後にも発火する (60秒待たない)
 *
 * 想定マウント箇所: `<Layout>` 直下 (アプリ全体で1インスタンス)。
 */
export function useLivePolling(matches: Match[] | undefined) {
  const matchesRef = useRef<Match[] | undefined>(matches);
  matchesRef.current = matches;
  const initialFiredRef = useRef(false);

  const tick = async () => {
    const list = matchesRef.current;
    if (!list || list.length === 0) return;
    const now = Date.now();
    const live = list.filter((m) => isLive(m, now));
    if (live.length === 0) return;
    const source = getLiveSource();
    // eslint-disable-next-line no-console
    console.info(`[live] polling ${live.length} match(es)`, live.map((m) => m.id));
    for (const m of live) {
      try {
        const update = await source.fetchUpdate(m);
        if (update) {
          setMatchOverride(m.id, {
            ...update,
            matchId: m.id,
            fetchedAt: new Date().toISOString(),
          });
          // eslint-disable-next-line no-console
          console.info(`[live] ${m.id} updated:`, {
            status: update.status,
            score: update.score,
            goals: update.goals?.length,
            bookings: update.bookings?.length,
            subs: update.substitutions?.length,
            hasFormation: Boolean(update.homeFormation || update.awayFormation),
            hasStats: Boolean(update.stats),
          });
        } else {
          // eslint-disable-next-line no-console
          console.info(`[live] ${m.id} update was null (not in mapping or fetch failed)`);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[live] failed to fetch update for ${m.id}:`, err);
      }
    }
  };

  // matches が初めて利用可能になった瞬間に即時 fetch
  useEffect(() => {
    if (initialFiredRef.current) return;
    if (!matches || matches.length === 0) return;
    initialFiredRef.current = true;
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches]);

  // 1分毎の定期ポーリング (アンマウント時にクリーンアップ)
  useEffect(() => {
    const id = window.setInterval(() => {
      tick();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
