/**
 * テスト試合 (test_che_tot, Sofascore event 16087727) のデータを取得し、
 * dev サーバーの書き込みエンドポイント経由で match_results.json に保存する。
 *
 * 使い方: node scripts/fetch-test-match.mjs
 *  (dev サーバー `npm run dev` が起動していること)
 *
 * 試合終了済みのため `useLivePolling` の自動取得対象外なので、一回限りの
 * 取り込み用ユーティリティ。`services/sofascoreSource.ts` と同じ
 * 変換ロジックを再実装している（独立スクリプト化のため）:
 *  - /event/{id}                 : score / status
 *  - /event/{id}/incidents       : goals / bookings / substitutions
 *  - /event/{id}/lineups         : homeFormation / awayFormation
 *  - /event/{id}/statistics      : possession / xG / shots / shotsOnTarget
 */

const PROXY = "http://localhost:5173/sofascore-api";
const WRITE = "http://localhost:5173/__dev/match-results";
const MATCH_ID = "test_che_tot";
const EVENT_ID = 16087727;
const HOME_TEAM_ID = "CHE";
const AWAY_TEAM_ID = "TOT";

const GOAL_CLASS = { regular: "normal", penalty: "penalty", ownGoal: "own" };
const CARD_CLASS = { yellow: "Y", red: "R", yellowRed: "Y2R" };

function mapStatus(s) {
  const t = s?.type;
  if (t === "finished") return "finished";
  if (t === "inprogress") return "live";
  return "scheduled";
}

// ---- formation 生成 (utils/formation.ts と同じ仕様) ----

function layerRoleHint(layerIdx, totalLayers, category) {
  if (category === "G") return "GK";
  if (totalLayers <= 1) return category;
  if (layerIdx === 0) return "DF";
  if (layerIdx === totalLayers - 1) return "FW";
  return "MF";
}

function generateFormation(formationStr, players, bench) {
  const parts = formationStr
    .split("-")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  const spots = [];

  if (players[0]) {
    spots.push({
      x: 8,
      y: 50,
      number: players[0].number,
      name: players[0].name,
      role: "GK",
    });
  }

  const X_MIN = 22;
  const X_MAX = 80;
  const layerCount = parts.length;
  let cursor = 1;

  parts.forEach((count, layerIdx) => {
    const x =
      layerCount === 1
        ? (X_MIN + X_MAX) / 2
        : X_MIN + (layerIdx / (layerCount - 1)) * (X_MAX - X_MIN);
    for (let i = 0; i < count; i++) {
      const p = players[cursor++];
      if (!p) continue;
      const y = ((i + 0.5) / count) * 100;
      spots.push({
        x,
        y,
        number: p.number,
        name: p.name,
        role: layerRoleHint(layerIdx, layerCount, p.category),
      });
    }
  });

  return {
    shape: formationStr,
    starting: spots,
    bench: bench && bench.length > 0 ? bench : undefined,
  };
}

function convertSide(side) {
  if (!side?.formation || !side.players) return undefined;
  const starting = side.players
    .filter((p) => !p.substitute)
    .map((p) => ({
      name: p.player?.name ?? p.player?.shortName ?? "?",
      number: p.shirtNumber,
      category: p.position,
    }));
  const bench = side.players
    .filter((p) => p.substitute)
    .map((p) => ({
      name: p.player?.name ?? p.player?.shortName ?? "?",
      number: p.shirtNumber,
    }));
  if (starting.length === 0) return undefined;
  return generateFormation(side.formation, starting, bench);
}

// ---- statistics 変換 (utils/formation.ts と同じ仕様) ----

function parseStatNumber(v) {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return undefined;
  const n = parseFloat(v.replace("%", ""));
  return Number.isFinite(n) ? n : undefined;
}

function findStat(items, ...names) {
  const norm = (s) => s.toLowerCase().trim();
  const wanted = names.map(norm);
  const found = items.find(
    (it) => typeof it.name === "string" && wanted.includes(norm(it.name))
  );
  if (!found) return undefined;
  const home = found.homeValue ?? parseStatNumber(found.home);
  const away = found.awayValue ?? parseStatNumber(found.away);
  if (typeof home !== "number" || typeof away !== "number") return undefined;
  return { home, away };
}

function parseStats(json) {
  const all =
    json.statistics?.find((s) => s.period === "ALL") ?? json.statistics?.[0];
  if (!all) return undefined;
  const items = (all.groups ?? []).flatMap((g) => g.statisticsItems ?? []);
  if (items.length === 0) return undefined;
  const stats = {};
  const possession = findStat(items, "Ball possession", "Possession");
  if (possession) stats.possession = possession;
  const xG = findStat(items, "Expected goals", "xG", "Expected Goals (xG)");
  if (xG) stats.xG = xG;
  const shots = findStat(items, "Total shots", "Shots");
  if (shots) stats.shots = shots;
  const sot = findStat(items, "Shots on target", "Shots on goal");
  if (sot) stats.shotsOnTarget = sot;
  return Object.keys(stats).length === 0 ? undefined : stats;
}

// ---- メイン ----

async function fetchJson(path, allow404 = false) {
  const res = await fetch(`${PROXY}${path}`);
  if (!res.ok) {
    if (allow404 && res.status === 404) return null;
    throw new Error(`${path}: HTTP ${res.status}`);
  }
  return res.json();
}

async function main() {
  const [eventJson, incJson, lineupsJson, statsJson] = await Promise.all([
    fetchJson(`/event/${EVENT_ID}`),
    fetchJson(`/event/${EVENT_ID}/incidents`),
    fetchJson(`/event/${EVENT_ID}/lineups`, true),
    fetchJson(`/event/${EVENT_ID}/statistics`, true),
  ]);

  const ev = eventJson.event;
  const incidents = incJson?.incidents ?? [];

  const update = { matchId: MATCH_ID };
  update.status = mapStatus(ev.status);
  if (ev.status?.description) update.liveLabel = ev.status.description;
  if (
    typeof ev.homeScore?.current === "number" &&
    typeof ev.awayScore?.current === "number"
  ) {
    update.score = { home: ev.homeScore.current, away: ev.awayScore.current };
  }
  if (
    typeof ev.homeScore?.penalties === "number" &&
    typeof ev.awayScore?.penalties === "number"
  ) {
    update.penaltyScore = {
      home: ev.homeScore.penalties,
      away: ev.awayScore.penalties,
    };
  }

  // ---- incidents (goals, bookings, subs) ----
  const goals = [];
  const bookings = [];
  const subs = [];
  for (const i of incidents) {
    const teamId = i.isHome ? HOME_TEAM_ID : AWAY_TEAM_ID;
    const minute = typeof i.time === "number" ? i.time : 0;
    if (i.incidentType === "goal") {
      goals.push({
        minute,
        teamId,
        playerName: i.player?.name,
        assistPlayerName: i.assist1?.name,
        type: GOAL_CLASS[i.incidentClass] ?? "normal",
      });
    } else if (i.incidentType === "card") {
      bookings.push({
        minute,
        teamId,
        playerName: i.player?.name,
        type: CARD_CLASS[i.incidentClass] ?? "Y",
      });
    } else if (i.incidentType === "substitution") {
      subs.push({
        minute,
        teamId,
        inName: i.playerIn?.name,
        outName: i.playerOut?.name,
      });
    }
  }
  goals.sort((a, b) => a.minute - b.minute);
  bookings.sort((a, b) => a.minute - b.minute);
  subs.sort((a, b) => a.minute - b.minute);
  if (goals.length) update.goals = goals;
  if (bookings.length) update.bookings = bookings;
  if (subs.length) update.substitutions = subs;

  // ---- lineups (formations) ----
  if (lineupsJson) {
    const homeFormation = convertSide(lineupsJson.home);
    const awayFormation = convertSide(lineupsJson.away);
    if (homeFormation) update.homeFormation = homeFormation;
    if (awayFormation) update.awayFormation = awayFormation;
  }

  // ---- statistics ----
  if (statsJson) {
    const stats = parseStats(statsJson);
    if (stats) update.stats = stats;
  }

  update.fetchedAt = new Date().toISOString();

  console.log("--- 構築サマリ ---");
  console.log(`status:          ${update.status}`);
  console.log(`score:           ${update.score?.home}-${update.score?.away}`);
  console.log(`goals:           ${update.goals?.length ?? 0}`);
  console.log(`bookings:        ${update.bookings?.length ?? 0}`);
  console.log(`substitutions:   ${update.substitutions?.length ?? 0}`);
  console.log(
    `homeFormation:   ${update.homeFormation?.shape ?? "なし"} (${update.homeFormation?.starting?.length ?? 0}人, bench ${update.homeFormation?.bench?.length ?? 0})`
  );
  console.log(
    `awayFormation:   ${update.awayFormation?.shape ?? "なし"} (${update.awayFormation?.starting?.length ?? 0}人, bench ${update.awayFormation?.bench?.length ?? 0})`
  );
  console.log(`stats:           ${update.stats ? Object.keys(update.stats).join(", ") : "なし"}`);

  const payload = { [MATCH_ID]: update };
  const writeRes = await fetch(WRITE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!writeRes.ok) {
    throw new Error(`write failed: ${writeRes.status} ${writeRes.statusText}`);
  }
  const ok = await writeRes.json();
  console.log(`\nmatch_results.json updated. total entries: ${ok.count}`);
}

main().catch((e) => {
  console.error("error:", e.message);
  process.exit(1);
});
