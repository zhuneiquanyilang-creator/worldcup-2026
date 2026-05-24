import type { Match } from "@/types/match";
import type { Standing } from "@/types/standing";

/**
 * グループ順位の確定（clinch）判定。
 *
 * 「最終節を待たずに順位が決まった」場合に R32 等の `A組1位` プレースホルダを
 * 実チームに差し替えるための前処理。残り試合があっても、その結果に関わらず
 * 順位が変わらない（mathematically locked）位置だけを返す。
 *
 * 戦略:
 *  - 残り 0 試合: 全順位確定（順位は points → 得失点差 → 得点 の簡易タイブレーカー）。
 *  - 残り 1〜2 試合: 0–5 点ずつの全スコア組み合わせを総当たりし、各順位が
 *    全結果で同一チームになるかを判定（GD/得点での確定も拾える）。
 *  - 残り 3 試合以上: 勝ち点だけの保守的チェックに切替（GD/H2H は無視。
 *    早期段階で誤って確定扱いしない）。
 */

// 1試合あたりの想定スコア範囲（総当たり用）。0–5 × 0–5 = 36 通り。
const SCORE_RANGE = [0, 1, 2, 3, 4, 5] as const;
// この本数を超える残り試合がある場合は総当たりせず勝ち点のみで保守的に判定。
const ENUM_REMAINING_LIMIT = 2;

function emptyStanding(teamId: string, groupId: string): Standing {
  return {
    teamId,
    groupId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDiff: 0,
    points: 0,
  };
}

function applyResult(home: Standing, away: Standing, hs: number, as: number) {
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

/** StandingsTable と同じ簡易タイブレーカー（H2H/フェアプレーは未対応）。 */
function compareSimple(a: Standing, b: Standing) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  return b.goalsFor - a.goalsFor;
}

function buildBase(
  groupTeamIds: string[],
  groupId: string,
  finishedMatches: Match[]
): Map<string, Standing> {
  const map = new Map<string, Standing>();
  for (const id of groupTeamIds) map.set(id, emptyStanding(id, groupId));
  for (const m of finishedMatches) {
    if (!m.score) continue;
    const h = map.get(m.homeTeamId);
    const a = map.get(m.awayTeamId);
    if (!h || !a) continue;
    applyResult(h, a, m.score.home, m.score.away);
  }
  return map;
}

function snapshotOrder(map: Map<string, Standing>): string[] {
  return [...map.values()].sort(compareSimple).map((s) => s.teamId);
}

function cloneMap(base: Map<string, Standing>): Map<string, Standing> {
  const clone = new Map<string, Standing>();
  for (const [k, v] of base) clone.set(k, { ...v });
  return clone;
}

function enumerateOrderings(
  base: Map<string, Standing>,
  remaining: Match[]
): string[][] {
  const orderings: string[][] = [];
  const stack: { hs: number; as: number; match: Match }[] = [];

  const recurse = (idx: number) => {
    if (idx === remaining.length) {
      const clone = cloneMap(base);
      for (const r of stack) {
        const h = clone.get(r.match.homeTeamId);
        const a = clone.get(r.match.awayTeamId);
        if (h && a) applyResult(h, a, r.hs, r.as);
      }
      orderings.push(snapshotOrder(clone));
      return;
    }
    const m = remaining[idx];
    for (const hs of SCORE_RANGE) {
      for (const as of SCORE_RANGE) {
        stack.push({ match: m, hs, as });
        recurse(idx + 1);
        stack.pop();
      }
    }
  };

  recurse(0);
  return orderings;
}

function pointsOnlyClinch(
  base: Map<string, Standing>,
  remaining: Match[]
): Map<number, string> {
  const remainingByTeam = new Map<string, number>();
  for (const m of remaining) {
    remainingByTeam.set(
      m.homeTeamId,
      (remainingByTeam.get(m.homeTeamId) ?? 0) + 1
    );
    remainingByTeam.set(
      m.awayTeamId,
      (remainingByTeam.get(m.awayTeamId) ?? 0) + 1
    );
  }
  const sorted = [...base.values()].sort(compareSimple);
  const locked = new Map<number, string>();
  for (let k = 0; k < sorted.length; k++) {
    const top = sorted[k];
    let allLocked = true;
    for (let j = k + 1; j < sorted.length; j++) {
      const below = sorted[j];
      // top は残り試合を全敗、below は残り試合を全勝した場合の勝ち点を比較
      const topMin = top.points;
      const belowMax = below.points + 3 * (remainingByTeam.get(below.teamId) ?? 0);
      if (topMin <= belowMax) {
        allLocked = false;
        break;
      }
    }
    if (!allLocked) break;
    locked.set(k + 1, top.teamId);
  }
  return locked;
}

/**
 * グループ内で「確定済み順位」を返す。Map<順位 1.., teamId>。
 * 1位から連続的に確定している位置だけが含まれる（途中で破綻したら以降は含めない）。
 */
export function clinchedRanks(
  groupTeamIds: string[],
  groupId: string,
  finishedMatches: Match[],
  remainingMatches: Match[]
): Map<number, string> {
  const base = buildBase(groupTeamIds, groupId, finishedMatches);

  if (remainingMatches.length === 0) {
    const order = snapshotOrder(base);
    return new Map(order.map((id, i) => [i + 1, id]));
  }

  if (remainingMatches.length > ENUM_REMAINING_LIMIT) {
    return pointsOnlyClinch(base, remainingMatches);
  }

  const orderings = enumerateOrderings(base, remainingMatches);
  const locked = new Map<number, string>();
  const n = groupTeamIds.length;
  for (let k = 0; k < n; k++) {
    const first = orderings[0][k];
    if (orderings.every((o) => o[k] === first)) {
      locked.set(k + 1, first);
    } else {
      break;
    }
  }
  return locked;
}
