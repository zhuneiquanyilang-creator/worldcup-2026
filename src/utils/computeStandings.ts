import type { Match } from "@/types/match";
import type { Standing } from "@/types/standing";
import type { Team } from "@/types/team";

/**
 * グループステージの順位表を試合結果から導出する。
 * 全チームを 0-0-0 で初期化し、`stage === "group"` のうち **score が入った試合**
 * (= 終了 or ライブ進行中で得点情報あり) を反映する。
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
    // スコアが入っていれば status は問わない (= 「今のスコアで終了したと仮定」)。
    // status を厳格にチェックすると、古い live override (localStorage) が status
    // だけ "live"/"scheduled" で残っているケースで finished + score の file 値が
    // 反映されなくなってしまう (MatchCard / BracketMatch と同じ理由)。
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
