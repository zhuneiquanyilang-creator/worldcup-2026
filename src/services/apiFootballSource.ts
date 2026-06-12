import type {
  Match,
  Goal,
  Booking,
  BookingType,
  Substitution,
  MatchStatus,
  FormationData,
  MatchStats,
} from "@/types/match";
import type { Player } from "@/types/player";
import type { LiveUpdate } from "@/types/live";
import type { LiveSource } from "./liveSource";
import { generateFormation, type RawPlayer } from "@/utils/formation";
import { dataUrl } from "@/utils/dataUrl";

/**
 * API-Football (api-sports.io) を使ったライブソース。
 *
 * 無料枠 (100 req/日) で動かすため、リクエスト最適化を強めにかける:
 *
 *   - **basic info** (`/fixtures?live=all`): 全ライブ試合を 1 リクエストで取得。
 *      モジュールキャッシュ TTL = 15 分。複数試合が同時 LIVE の日に大きく効く。
 *   - **lineups** (`/fixtures/lineups?fixture=X`): 試合あたり 1 回だけ取得して
 *      キャッシュ。試合中の交代はキャッシュからではなく events 側で反映する。
 *   - **events** (`/fixtures/events?fixture=X`): 試合あたり 15 分 TTL。
 *   - **statistics** (`/fixtures/statistics?fixture=X`): 終了状態 (FT/AET/PEN)
 *      に入った試合のみ 1 回取得。
 *
 * 1 日あたり想定: 3 試合バラけ日で 50〜70、6 試合同時日でも ~80 req に収まる設計。
 *
 * 試合 ID マッピングは `public/data/apifootball_mapping.json` (m??? → fixtureId)。
 * 未登録の試合は null を返して graceful にスキップ。
 */
const API_BASE = "/api-football"; // Vite dev proxy 経由
const BATCH_TTL_MS = 15 * 60_000;
const EVENTS_TTL_MS = 15 * 60_000;

type Mapping = { mapping: Record<string, number> };

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    periods?: { first?: number | null; second?: number | null };
    status: { long?: string; short?: string; elapsed?: number };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime?: { home: number | null; away: number | null };
    fulltime?: { home: number | null; away: number | null };
    extratime?: { home: number | null; away: number | null };
    penalty?: { home: number | null; away: number | null };
  };
};

type ApiLineupPlayer = {
  player: {
    id?: number;
    name?: string;
    number?: number;
    pos?: string; // G / D / M / F
    grid?: string | null; // "1:1" など
  };
};

type ApiLineup = {
  team: { id: number; name: string };
  formation?: string;
  startXI?: ApiLineupPlayer[];
  substitutes?: ApiLineupPlayer[];
};

type ApiEvent = {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string };
  player: { id?: number | null; name?: string | null };
  assist?: { id?: number | null; name?: string | null };
  type: string; // "Goal" | "Card" | "subst" | "Var"
  detail: string;
  comments?: string | null;
};

type ApiStat = {
  team: { id: number; name: string };
  statistics: { type: string; value: number | string | null }[];
};

// --- モジュールキャッシュ -----------------------------------------------------

let mappingCache: Record<string, number> | null = null;
let playersCache: Player[] | null = null;
let teamNumberIndexCache: Map<string, string> | null = null;
let playerByIdCache: Map<string, Player> | null = null;

let batchCache: { time: number; byFixtureId: Map<number, ApiFixture> } = {
  time: 0,
  byFixtureId: new Map(),
};
const lineupsCache = new Map<number, ApiLineup[]>();
const eventsCache = new Map<number, { time: number; events: ApiEvent[] }>();
const statsCache = new Map<number, ApiStat[]>();
// 単発取得 (pre-match / FT 後) のキャッシュ。/fixtures?live=all に出てこない
// 試合を毎ティック叩いて枠を浪費しないよう、こちらも TTL を持たせる。
const SINGLE_FIXTURE_TTL_MS = 5 * 60_000;
const singleFixtureCache = new Map<
  number,
  { time: number; fixture: ApiFixture | null }
>();

async function loadMapping(): Promise<Record<string, number>> {
  if (mappingCache) return mappingCache;
  try {
    const r = await fetch(dataUrl("apifootball_mapping.json"));
    if (!r.ok) {
      mappingCache = {};
      return mappingCache;
    }
    const data = (await r.json()) as Mapping;
    mappingCache = data.mapping ?? {};
  } catch {
    mappingCache = {};
  }
  return mappingCache;
}

async function loadPlayers(): Promise<Player[]> {
  if (playersCache) return playersCache;
  try {
    const r = await fetch(dataUrl("players.json"));
    if (!r.ok) {
      playersCache = [];
      return playersCache;
    }
    playersCache = (await r.json()) as Player[];
  } catch {
    playersCache = [];
  }
  return playersCache;
}

function getTeamNumberIndex(players: Player[]): Map<string, string> {
  if (teamNumberIndexCache) return teamNumberIndexCache;
  const m = new Map<string, string>();
  for (const p of players) {
    if (typeof p.number === "number") {
      m.set(`${p.teamId}:${p.number}`, p.id);
    }
  }
  teamNumberIndexCache = m;
  return m;
}

function getPlayerById(players: Player[]): Map<string, Player> {
  if (playerByIdCache) return playerByIdCache;
  playerByIdCache = new Map(players.map((p) => [p.id, p]));
  return playerByIdCache;
}

// --- 変換ロジック ------------------------------------------------------------

function mapStatus(short: string | undefined): MatchStatus | undefined {
  switch (short) {
    case "TBD":
    case "NS":
    case "PST":
    case "CANC":
    case "ABD":
      return "scheduled";
    case "1H":
    case "HT":
    case "2H":
    case "ET":
    case "BT":
    case "P":
    case "SUSP":
    case "INT":
    case "LIVE":
      return "live";
    case "FT":
    case "AET":
    case "PEN":
    case "AWD":
    case "WO":
      return "finished";
    default:
      return undefined;
  }
}

function mapGoalType(detail: string): Goal["type"] {
  const d = detail.toLowerCase();
  if (d.includes("own goal")) return "own";
  if (d.includes("penalty")) return "penalty";
  return "normal";
}

function mapCardType(detail: string): BookingType | undefined {
  const d = detail.toLowerCase();
  if (d.includes("yellow")) return "Y";
  if (d.includes("red")) return "R";
  return undefined;
}

function toRawPlayer(p: ApiLineupPlayer): RawPlayer {
  return {
    name: p.player?.name ?? "?",
    number: p.player?.number,
    category: p.player?.pos,
  };
}

function convertLineup(lineup: ApiLineup): FormationData | undefined {
  if (!lineup.formation || !lineup.startXI || lineup.startXI.length === 0)
    return undefined;
  // API-Football の startXI は GK → DEF → MID → FW の順で並んでいる
  const starting = lineup.startXI.map(toRawPlayer);
  const bench = (lineup.substitutes ?? []).map((p) => ({
    name: p.player?.name ?? "?",
    number: p.player?.number,
  }));
  return generateFormation(lineup.formation, starting, bench);
}

function parseStatNumber(v: string | number | null | undefined): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return undefined;
  const n = parseFloat(v.replace("%", ""));
  return Number.isFinite(n) ? n : undefined;
}

function parseStats(stats: ApiStat[] | undefined): MatchStats | undefined {
  if (!stats || stats.length < 2) return undefined;
  const home = stats[0]?.statistics ?? [];
  const away = stats[1]?.statistics ?? [];
  const find = (s: { type: string; value: number | string | null }[], names: string[]) => {
    const norm = (x: string) => x.toLowerCase().trim();
    const wanted = names.map(norm);
    return s.find((it) => wanted.includes(norm(it.type)))?.value;
  };
  const stat: MatchStats = {};
  const ph = parseStatNumber(find(home, ["Ball Possession"]));
  const pa = parseStatNumber(find(away, ["Ball Possession"]));
  if (typeof ph === "number" && typeof pa === "number")
    stat.possession = { home: ph, away: pa };
  const xh = parseStatNumber(find(home, ["expected_goals", "Expected Goals"]));
  const xa = parseStatNumber(find(away, ["expected_goals", "Expected Goals"]));
  if (typeof xh === "number" && typeof xa === "number")
    stat.xG = { home: xh, away: xa };
  const sh = parseStatNumber(find(home, ["Total Shots"]));
  const sa = parseStatNumber(find(away, ["Total Shots"]));
  if (typeof sh === "number" && typeof sa === "number")
    stat.shots = { home: sh, away: sa };
  const oh = parseStatNumber(find(home, ["Shots on Goal", "Shots on Target"]));
  const oa = parseStatNumber(find(away, ["Shots on Goal", "Shots on Target"]));
  if (typeof oh === "number" && typeof oa === "number")
    stat.shotsOnTarget = { home: oh, away: oa };
  return Object.keys(stat).length === 0 ? undefined : stat;
}

// --- 取得 (キャッシュ層付き) -------------------------------------------------

async function refreshBatch(): Promise<void> {
  try {
    const r = await fetch(`${API_BASE}/fixtures?live=all`);
    if (!r.ok) return;
    const data = await r.json();
    const byId = new Map<number, ApiFixture>();
    for (const fx of data.response ?? []) {
      byId.set(fx.fixture.id, fx as ApiFixture);
    }
    batchCache = { time: Date.now(), byFixtureId: byId };
  } catch {
    // 失敗してもキャッシュは前回値のまま
  }
}

async function fetchSingleFixture(fixtureId: number): Promise<ApiFixture | null> {
  const cached = singleFixtureCache.get(fixtureId);
  if (cached && Date.now() - cached.time < SINGLE_FIXTURE_TTL_MS) {
    return cached.fixture;
  }
  try {
    const r = await fetch(`${API_BASE}/fixtures?id=${fixtureId}`);
    if (!r.ok) {
      singleFixtureCache.set(fixtureId, { time: Date.now(), fixture: null });
      return null;
    }
    const data = await r.json();
    const fx = (data.response?.[0] as ApiFixture) ?? null;
    singleFixtureCache.set(fixtureId, { time: Date.now(), fixture: fx });
    return fx;
  } catch {
    return cached?.fixture ?? null;
  }
}

async function fetchLineups(fixtureId: number): Promise<ApiLineup[] | null> {
  if (lineupsCache.has(fixtureId)) return lineupsCache.get(fixtureId)!;
  try {
    const r = await fetch(`${API_BASE}/fixtures/lineups?fixture=${fixtureId}`);
    if (!r.ok) return null;
    const data = await r.json();
    const list = (data.response as ApiLineup[]) ?? [];
    if (list.length >= 2 && list.every((l) => l.startXI && l.startXI.length > 0)) {
      lineupsCache.set(fixtureId, list);
      return list;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchEvents(fixtureId: number): Promise<ApiEvent[]> {
  const cached = eventsCache.get(fixtureId);
  if (cached && Date.now() - cached.time < EVENTS_TTL_MS) return cached.events;
  try {
    const r = await fetch(`${API_BASE}/fixtures/events?fixture=${fixtureId}`);
    if (!r.ok) return cached?.events ?? [];
    const data = await r.json();
    const events = (data.response as ApiEvent[]) ?? [];
    eventsCache.set(fixtureId, { time: Date.now(), events });
    return events;
  } catch {
    return cached?.events ?? [];
  }
}

async function fetchStats(fixtureId: number): Promise<ApiStat[] | null> {
  if (statsCache.has(fixtureId)) return statsCache.get(fixtureId)!;
  try {
    const r = await fetch(`${API_BASE}/fixtures/statistics?fixture=${fixtureId}`);
    if (!r.ok) return null;
    const data = await r.json();
    const list = (data.response as ApiStat[]) ?? [];
    if (list.length >= 2) {
      statsCache.set(fixtureId, list);
      return list;
    }
    return null;
  } catch {
    return null;
  }
}

// --- LiveSource 実装 ---------------------------------------------------------

export class ApiFootballLiveSource implements LiveSource {
  async fetchUpdate(match: Match): Promise<LiveUpdate | null> {
    const mapping = await loadMapping();
    const fixtureId = mapping[match.id];
    if (!fixtureId) return null;

    // 1. 基本情報: まず batch キャッシュを試す。古ければ refresh。それでも入って
    //    いなければ /fixtures?id=X (pre-match / 非 live でも取れる) を 1 回叩く。
    let fx: ApiFixture | null | undefined = batchCache.byFixtureId.get(fixtureId);
    const batchAge = Date.now() - batchCache.time;
    if (!fx || batchAge > BATCH_TTL_MS) {
      await refreshBatch();
      fx = batchCache.byFixtureId.get(fixtureId);
    }
    if (!fx) {
      // pre-match や FT で live=all に出てこない場合のフォールバック
      fx = await fetchSingleFixture(fixtureId);
    }
    if (!fx) return null;

    const status = mapStatus(fx.fixture.status.short);

    const update: LiveUpdate = { matchId: match.id };
    if (status) update.status = status;
    if (typeof fx.goals?.home === "number" && typeof fx.goals?.away === "number") {
      update.score = { home: fx.goals.home, away: fx.goals.away };
    }
    if (
      typeof fx.score?.penalty?.home === "number" &&
      typeof fx.score?.penalty?.away === "number"
    ) {
      update.penaltyScore = {
        home: fx.score.penalty.home,
        away: fx.score.penalty.away,
      };
    }
    update.liveLabel = fx.fixture.status.long;
    // currentPeriodStart: 2nd half が始まっていればそちら、なければ 1st half
    const secondTs = fx.fixture.periods?.second;
    const firstTs = fx.fixture.periods?.first;
    if (typeof secondTs === "number" && secondTs > 0) {
      update.currentPeriodStart = secondTs * 1000;
    } else if (typeof firstTs === "number" && firstTs > 0) {
      update.currentPeriodStart = firstTs * 1000;
    }

    // 2. Lineups (キャッシュ一発)
    const homeApiId = fx.teams.home.id;
    const awayApiId = fx.teams.away.id;
    const lineups = await fetchLineups(fixtureId);
    if (lineups) {
      const homeL = lineups.find((l) => l.team.id === homeApiId) ?? lineups[0];
      const awayL = lineups.find((l) => l.team.id === awayApiId) ?? lineups[1];
      const home = convertLineup(homeL);
      const away = convertLineup(awayL);
      if (home) update.homeFormation = home;
      if (away) update.awayFormation = away;
    }

    // 3. Events (live / finished のみ。15 分 TTL)
    if (status === "live" || status === "finished") {
      const players = await loadPlayers();
      const teamNumberIndex = getTeamNumberIndex(players);
      const playerById = getPlayerById(players);

      // 英語名 → shirtNumber マップ (lineup から構築)
      const buildNameToNum = (l: ApiLineup | undefined): Map<string, number> => {
        const m = new Map<string, number>();
        if (!l) return m;
        for (const arr of [l.startXI ?? [], l.substitutes ?? []]) {
          for (const p of arr) {
            const num = p.player?.number;
            const name = p.player?.name;
            if (name && typeof num === "number") m.set(name, num);
          }
        }
        return m;
      };
      const homeL = lineups?.find((l) => l.team.id === homeApiId) ?? lineups?.[0];
      const awayL = lineups?.find((l) => l.team.id === awayApiId) ?? lineups?.[1];
      const homeNameToNum = buildNameToNum(homeL);
      const awayNameToNum = buildNameToNum(awayL);

      const resolvePlayer = (
        name: string | null | undefined,
        teamApiId: number | undefined
      ): { id?: string; name?: string } => {
        if (!name) return { name: undefined };
        const isHome = teamApiId === homeApiId;
        const isAway = teamApiId === awayApiId;
        if (!isHome && !isAway) return { name };
        const teamId = isHome ? match.homeTeamId : match.awayTeamId;
        const num = (isHome ? homeNameToNum : awayNameToNum).get(name);
        if (typeof num !== "number") return { name };
        const id = teamNumberIndex.get(`${teamId}:${num}`);
        if (!id) return { name };
        const jp = playerById.get(id);
        return { id, name: jp?.name ?? name };
      };

      const events = await fetchEvents(fixtureId);
      const goals: Goal[] = [];
      const bookings: Booking[] = [];
      const subs: Substitution[] = [];

      for (const ev of events) {
        const teamApiId = ev.team?.id;
        const isHome = teamApiId === homeApiId;
        const teamId = isHome ? match.homeTeamId : match.awayTeamId;
        const minute = (ev.time?.elapsed ?? 0) + (ev.time?.extra ?? 0);
        const type = (ev.type ?? "").toLowerCase();

        if (type === "goal") {
          // OG は API-Football だと detail に "Own Goal" が入り、event.team は
          // 「得点が入った側」(= シューターの相手) になっている。
          // 自殺点の選手解決は反対側の lineup で行う必要がある。
          const isOG = mapGoalType(ev.detail) === "own";
          const scorerTeamApi = isOG
            ? isHome
              ? awayApiId
              : homeApiId
            : teamApiId;
          const scorer = resolvePlayer(ev.player?.name, scorerTeamApi);
          const assist = resolvePlayer(ev.assist?.name, teamApiId);
          goals.push({
            minute,
            teamId,
            playerId: scorer.id,
            playerName: scorer.name,
            assistPlayerId: assist.id,
            assistPlayerName: assist.name,
            type: mapGoalType(ev.detail),
          });
        } else if (type === "card") {
          const cardType = mapCardType(ev.detail);
          if (cardType) {
            const carded = resolvePlayer(ev.player?.name, teamApiId);
            bookings.push({
              minute,
              teamId,
              playerName: carded.name ?? "",
              type: cardType,
            });
          }
        } else if (type === "subst") {
          // API-Football: subst の player = 「IN (新しく入る選手)」、assist = 「OUT (退く選手)」
          const pIn = resolvePlayer(ev.player?.name, teamApiId);
          const pOut = resolvePlayer(ev.assist?.name, teamApiId);
          subs.push({
            minute,
            teamId,
            inName: pIn.name ?? "",
            outName: pOut.name ?? "",
          });
        }
      }
      goals.sort((a, b) => a.minute - b.minute);
      bookings.sort((a, b) => a.minute - b.minute);
      subs.sort((a, b) => a.minute - b.minute);
      update.goals = goals;
      update.bookings = bookings;
      update.substitutions = subs;
    }

    // 4. Statistics (FT/AET/PEN かつ未取得のときだけ叩く)
    if (status === "finished") {
      const stats = await fetchStats(fixtureId);
      const parsed = parseStats(stats ?? undefined);
      if (parsed) update.stats = parsed;
    } else if (statsCache.has(fixtureId)) {
      const parsed = parseStats(statsCache.get(fixtureId));
      if (parsed) update.stats = parsed;
    }

    return update;
  }
}
