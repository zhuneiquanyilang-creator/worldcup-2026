import type { Match } from "@/types/match";
import type { Standing } from "@/types/standing";

/**
 * FIFA 2026 W 杯 公式タイブレーカー実装。
 *
 * 適用順 (CLAUDE.md / docs/tournament.md 参照):
 *   ① 全試合の勝ち点
 *   ② 当該チーム間の勝ち点 (head-to-head, 以下 H2H)
 *   ③ H2H 得失点差
 *   ④ H2H 得点
 *   ⑤ 全試合の得失点差
 *   ⑥ 全試合の得点
 *   ⑦ フェアプレーポイント (`Standing.fairPlayPoints`)
 *   ⑧⑨ FIFA ランキング — 未実装 (データソース未確保のため抽選で代用される想定)
 *
 * ②〜④ で部分的に解消された場合、**まだ並んでいるサブ集合に対して再帰的に
 * ②〜④ を再適用**する (これが「再帰タイブレーカー」)。再帰しても全員並んだ
 * ままの場合は ⑤〜⑦ にフォールバックする。
 *
 * 注意: 公式ルールでは ②〜④ で部分集合が分離してもしなくても、それ以降は
 * ⑤〜⑦ ではなく **②〜④ の再帰** を先に適用する。実装もそれに従う。
 */

/** グループ内で本当に対戦している試合 (両チームが指定 teamIds に含まれ、
 *  score が確定しているもの) だけを抽出。 */
function collectH2hMatches(
  teamIds: Set<string>,
  matches: Match[]
): Match[] {
  const out: Match[] = [];
  for (const m of matches) {
    if (m.stage !== "group") continue;
    if (!m.score) continue;
    if (!teamIds.has(m.homeTeamId)) continue;
    if (!teamIds.has(m.awayTeamId)) continue;
    out.push(m);
  }
  return out;
}

type Mini = { points: number; goalDiff: number; goalsFor: number };

/** 指定したチーム同士の対戦結果だけで mini standings を作る。
 *  グループ全体の勝ち点ではなく、「対象チーム同士の」勝ち点である点が重要。 */
function buildMini(teamIds: Set<string>, h2h: Match[]): Map<string, Mini> {
  const mini = new Map<string, Mini>();
  for (const id of teamIds) mini.set(id, { points: 0, goalDiff: 0, goalsFor: 0 });
  for (const m of h2h) {
    const home = mini.get(m.homeTeamId);
    const away = mini.get(m.awayTeamId);
    if (!home || !away || !m.score) continue;
    const hs = m.score.home;
    const as = m.score.away;
    home.goalsFor += hs;
    home.goalDiff += hs - as;
    away.goalsFor += as;
    away.goalDiff += as - hs;
    if (hs > as) home.points += 3;
    else if (hs < as) away.points += 3;
    else {
      home.points += 1;
      away.points += 1;
    }
  }
  return mini;
}

/** ⑤⑥⑦ フォールバック比較 (全試合 GD → 全試合 GF → フェアプレー)。
 *  フェアプレーは負の値が悪いので「より大きい方が上位」(降順)。 */
function compareOverall(a: Standing, b: Standing): number {
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  if (b.fairPlayPoints !== a.fairPlayPoints)
    return b.fairPlayPoints - a.fairPlayPoints;
  return 0;
}

/** H2H mini standings の比較 (②③④)。 */
function compareMini(a: Mini, b: Mini): number {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return 0;
}

function miniKey(m: Mini): string {
  return `${m.points}:${m.goalDiff}:${m.goalsFor}`;
}

/** 並んでいるクラスタに ②〜④ を再帰適用する。
 *  分離できなければ ⑤〜⑦ にフォールバック。 */
function rankCluster(cluster: Standing[], allMatches: Match[]): Standing[] {
  if (cluster.length <= 1) return cluster;

  const teamIds = new Set(cluster.map((s) => s.teamId));
  const h2h = collectH2hMatches(teamIds, allMatches);
  const mini = buildMini(teamIds, h2h);

  // H2H 値でソート
  const sorted = [...cluster].sort((a, b) => {
    const ma = mini.get(a.teamId)!;
    const mb = mini.get(b.teamId)!;
    return compareMini(ma, mb);
  });

  // 同じ H2H 値のサブクラスタに分割
  const subClusters: Standing[][] = [];
  let current: Standing[] = [];
  let prevKey: string | null = null;
  for (const s of sorted) {
    const key = miniKey(mini.get(s.teamId)!);
    if (key !== prevKey) {
      if (current.length > 0) subClusters.push(current);
      current = [];
      prevKey = key;
    }
    current.push(s);
  }
  if (current.length > 0) subClusters.push(current);

  // サブクラスタごとに処理:
  //  - 1 チーム: 確定
  //  - 元のクラスタと同じサイズ (= H2H で誰も分離できなかった): ⑤⑥⑦ フォールバック
  //  - それ以外: ②〜④ を再帰適用
  const result: Standing[] = [];
  for (const sub of subClusters) {
    if (sub.length === 1) {
      result.push(sub[0]);
    } else if (sub.length === cluster.length) {
      const fallback = [...sub].sort(compareOverall);
      result.push(...fallback);
    } else {
      result.push(...rankCluster(sub, allMatches));
    }
  }
  return result;
}

/**
 * グループ内順位表を FIFA 公式タイブレーカーでソートして返す。
 * 同一グループ内 (= H2H 対戦が成立しうる) 用。
 */
export function sortGroupStandings(
  standings: Standing[],
  matches: Match[]
): Standing[] {
  // ① 勝ち点で大枠を並べてからグループ化、各グループにクラスタ内ロジックを適用
  const sortedByPoints = [...standings].sort((a, b) => b.points - a.points);
  const pointGroups: Standing[][] = [];
  let current: Standing[] = [];
  let prevPoints: number | null = null;
  for (const s of sortedByPoints) {
    if (s.points !== prevPoints) {
      if (current.length > 0) pointGroups.push(current);
      current = [];
      prevPoints = s.points;
    }
    current.push(s);
  }
  if (current.length > 0) pointGroups.push(current);

  const result: Standing[] = [];
  for (const group of pointGroups) {
    if (group.length === 1) result.push(group[0]);
    else result.push(...rankCluster(group, matches));
  }
  return result;
}

/**
 * 異なるグループのチーム同士を比較する用 (3 位ワイルドカード等)。
 * H2H 対戦は無いので ①⑤⑥⑦ のみ。
 */
export function compareCrossGroup(a: Standing, b: Standing): number {
  if (b.points !== a.points) return b.points - a.points;
  return compareOverall(a, b);
}
