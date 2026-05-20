import type { Match } from "@/types/match";

export type TeamLiveStatus = "winning" | "losing" | "drawing";

/**
 * 指定チームが現在ライブ進行中の試合にいる場合、そのチームから見た現状を返す。
 * いずれのライブ試合にも参加していなければ undefined。
 *
 * 同時に複数のライブ試合があるケースは想定せず、最初に見つかったものを返す
 * (実運用上、1チームが同時刻に2試合は無いため問題なし)。
 */
export function getTeamLiveStatus(
  teamId: string,
  matches: Match[]
): TeamLiveStatus | undefined {
  for (const m of matches) {
    if (m.status !== "live") continue;
    if (!m.score) continue;
    if (m.homeTeamId === teamId) {
      if (m.score.home > m.score.away) return "winning";
      if (m.score.home < m.score.away) return "losing";
      return "drawing";
    }
    if (m.awayTeamId === teamId) {
      if (m.score.away > m.score.home) return "winning";
      if (m.score.away < m.score.home) return "losing";
      return "drawing";
    }
  }
  return undefined;
}
