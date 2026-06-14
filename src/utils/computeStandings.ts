import type { Booking, Match } from "@/types/match";
import type { Standing } from "@/types/standing";
import type { Team } from "@/types/team";

/** Y=-1 / Y2R=-3 / R=-4 / YR=-5。Y2R / YR は「2 枚目イエロー退場 / イエロー後の
 *  一発レッド退場」を**単独イベント**として記録する想定 (preceding Y を別エントリで
 *  二重計上しない)。データ源が Y + Y2R の 2 件で記録する場合は集計ロジックを
 *  -1 / -2 に変える必要があるが、現状の `/edit/matches` 編集 UI と Sofascore 由来の
 *  ライブデータはいずれも単独イベントスタイル。 */
function fairPlayPenalty(type: Booking["type"]): number {
  switch (type) {
    case "Y":
      return -1;
    case "Y2R":
      return -3;
    case "R":
      return -4;
    case "YR":
      return -5;
  }
}

/**
 * グループステージの順位表を試合結果から導出する。
 * 全チームを 0-0-0 で初期化し、`stage === "group"` のうち **score が入った試合**
 * (= 終了 or ライブ進行中で得点情報あり) を反映する。
 * フェアプレーポイントも同じ試合範囲で集計する (タイブレーカー #7 用)。
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
      fairPlayPoints: 0,
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

    for (const b of m.bookings ?? []) {
      const s = map.get(b.teamId);
      if (!s) continue;
      s.fairPlayPoints += fairPlayPenalty(b.type);
    }
  }

  return Array.from(map.values());
}
