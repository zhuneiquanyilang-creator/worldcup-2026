import type { Match } from "@/types/match";

/** 試合がライブ進行中かを判定するための上限 (KOから何分後までライブ扱いするか)。
 *  90分 + ハーフタイム15分 + 延長/ロスタイム余裕30分 ≒ 135分。
 *  ノックアウトステージは延長戦/PK でさらに長引くので 180 分にしておく。
 */
function liveWindowMinutes(match: Match): number {
  return match.stage === "group" ? 135 : 180;
}

/** UTC ミリ秒で KO 時刻を返す */
export function kickoffEpoch(match: Match): number {
  return new Date(match.date).getTime();
}

/** いま (now) がこの試合のライブ枠内かどうか。
 *  status が "finished" のときは false (既に終了)。
 *  status が明示的に "live" のときは KO 前後でも true。
 *  それ以外は KO ≤ now ≤ KO + liveWindow を満たす場合 true。
 */
export function isLive(match: Match, now: number = Date.now()): boolean {
  if (match.status === "finished") return false;
  if (match.status === "live") return true;
  const ko = kickoffEpoch(match);
  return now >= ko && now <= ko + liveWindowMinutes(match) * 60_000;
}

/** 試合開始の何分前から polling を始めるか (フォーメーション・ベンチメンバー取得用)。 */
export const PREMATCH_POLL_MINUTES = 30;

/** ライブポーリングを発火させるべき試合かどうか。
 *  - status==="finished" → 永遠に false (確定済みは触らない)
 *  - status==="live" → 常に true
 *  - それ以外 (scheduled): 試合開始 30 分前以降は常に true (上限なし)。
 *    上限を撤廃したことで、KO の窓を逃した = ライブ中に取り逃した試合も
 *    後でサイトを開いた瞬間に拾い直せる (catchup 機能)。
 *    取れたら status==="finished" になるので翌回からは自然に対象外になる。
 *
 *  (Sofascore は status="notstarted" でもラインアップを返すので KO-30 分から
 *   開始することで予想スタメンも取れる。)
 */
export function shouldPoll(
  match: Match,
  now: number = Date.now(),
  prematchMinutes: number = PREMATCH_POLL_MINUTES
): boolean {
  if (match.status === "finished") return false;
  if (match.status === "live") return true;
  const ko = kickoffEpoch(match);
  const prematchStart = ko - prematchMinutes * 60_000;
  return now >= prematchStart;
}

/** いま試合中ではないが、まだ未開催 (KO 前) か */
export function isUpcoming(match: Match, now: number = Date.now()): boolean {
  if (match.status === "finished") return false;
  return now < kickoffEpoch(match);
}

