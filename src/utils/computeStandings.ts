import type { Match } from "@/types/match";
import type { Standing } from "@/types/standing";
import type { Team } from "@/types/team";

/**
 * グループステージの順位表を試合結果から導出する。
 * 全チームを 0-0-0 で初期化し、`status === "finished"` の `stage === "group"` 試合を反映。
 */
export function computeStandings(teams: Team[], matches: Match[]): Standing[] {
  const map = new Map<string, Standing>();

  for (const t of teams) {
    if (!t.groupId) continue;
    map.set(t.id, {
      teamId: t.id,
      groupId: t.groupId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const m of matches) {
    if (m.stage !== "group") continue;
    // ライブ中の試合も「今のスコアで終了したと仮定して」順位表に反映
    if (m.status !== "finished" && m.status !== "live") continue;
    if (!m.score) continue;
    const home = map.get(m.homeTeamId);
    const away = map.get(m.awayTeamId);
    if (!home || !away) continue;

    const hs = m.score.home;
    const as = m.score.away;
    home.played++;
    away.played++;
    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (hs > as) {
      home.won++;
      away.lost++;
    } else if (hs < as) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }

    home.goalDiff = home.goalsFor - home.goalsAgainst;
    away.goalDiff = away.goalsFor - away.goalsAgainst;
    home.points = home.won * 3 + home.drawn;
    away.points = away.won * 3 + away.drawn;
  }

  return Array.from(map.values());
}
