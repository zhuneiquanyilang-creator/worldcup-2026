// Football-Data.org から最近 (or 全) 試合の結果を取得して match_results.json に書き込む。
//
// 使い方:
//   node scripts/sync-footballdata-results.mjs               # 直近 7 日分の試合をまとめて同期
//   node scripts/sync-footballdata-results.mjs --all         # 大会全試合
//   node scripts/sync-footballdata-results.mjs --since=N     # 直近 N 日分
//   node scripts/sync-footballdata-results.mjs --match=m001  # 特定試合だけ
//
// dev サーバー起動状態で実行 (Football-Data の API キーは vite.config.ts の
// プロキシヘッダ経由で付与される)。
//
// 既存の match_results.json はフィールド単位でマージする (フォーメーション等を消さない)。

import fs from "fs";
import path from "path";

const DEV = "http://localhost:5173";

const matchesPath = path.resolve("public/data/matches.json");
const resultsPath = path.resolve("public/data/match_results.json");
const mappingPath = path.resolve("public/data/footballdata_mapping.json");

const matches = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf8")).mapping;

const args = process.argv.slice(2);
const onlyMatchId = args.find((a) => a.startsWith("--match="))?.split("=")[1];
const sinceDays = Number(
  args.find((a) => a.startsWith("--since="))?.split("=")[1] ?? "7"
);
const all = args.includes("--all");

function ymd(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function mapStatus(s) {
  if (s === "FINISHED" || s === "AWARDED") return "finished";
  if (s === "IN_PLAY" || s === "LIVE" || s === "PAUSED") return "live";
  if (s === "TIMED" || s === "SCHEDULED" || s === "POSTPONED") return "scheduled";
  return null;
}

// 10 req/分制限のため、1 リクエストあたり最低 7 秒空ける (= 約 8.5 req/分)
const THROTTLE_MS = 7000;
let lastReqTs = 0;

async function throttledFetch(url) {
  const wait = lastReqTs + THROTTLE_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastReqTs = Date.now();
  return fetch(url);
}

async function fetchTeamMatches(fdTeamId, date) {
  const d = new Date(date);
  const before = new Date(d.getTime() - 86400_000);
  const after = new Date(d.getTime() + 86400_000);
  const url = `${DEV}/football-data-api/teams/${fdTeamId}/matches?competitions=2000&dateFrom=${ymd(
    before
  )}&dateTo=${ymd(after)}`;
  const r = await throttledFetch(url);
  if (!r.ok) {
    // 429 (rate limit) なら 60 秒待ってリトライ 1 回
    if (r.status === 429) {
      console.warn(`  rate limited, waiting 60s…`);
      await new Promise((res) => setTimeout(res, 60_000));
      lastReqTs = Date.now();
      const r2 = await fetch(url);
      if (!r2.ok) {
        console.warn(`  fetch failed after retry (${r2.status}): ${url}`);
        return [];
      }
      const j = await r2.json();
      return j.matches ?? [];
    }
    console.warn(`  fetch failed (${r.status}): ${url}`);
    return [];
  }
  const j = await r.json();
  return j.matches ?? [];
}

async function main() {
  const now = Date.now();

  // 対象試合を絞る:
  //  --all                     → 全試合
  //  --match=mXXX              → 指定試合だけ
  //  --since=N (デフォルト 7)  → KO 時刻が「N 日前 〜 今」の範囲の試合 (= 最近行われた / 今ライブ中)
  let targets = matches;
  if (onlyMatchId) {
    targets = matches.filter((m) => m.id === onlyMatchId);
  } else if (!all) {
    const fromTs = now - sinceDays * 86400_000;
    targets = matches.filter((m) => {
      const ts = new Date(m.date).getTime();
      return ts >= fromTs && ts <= now + 3600_000; // 1 時間先まで (まもなく KO の試合)
    });
  }
  console.log(`Syncing ${targets.length} matches…`);

  // 既存 match_results.json をロード
  let existing = {};
  if (fs.existsSync(resultsPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    } catch {}
  }

  // チーム別キャッシュ (同じチームを 1 度しか叩かない)
  const teamCache = new Map();

  let synced = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const m of targets) {
    const entry = mapping[m.id];
    if (!entry) {
      skipped++;
      continue;
    }
    const fdTeamId =
      typeof entry === "number"
        ? null
        : entry.fdHomeTeamId ?? entry.fdAwayTeamId;
    const fdMatchId = typeof entry === "number" ? entry : entry.fdMatchId;
    if (!fdTeamId) {
      skipped++;
      continue;
    }

    const cacheKey = `${fdTeamId}:${ymd(m.date)}`;
    let teamMatches = teamCache.get(cacheKey);
    if (!teamMatches) {
      teamMatches = await fetchTeamMatches(fdTeamId, m.date);
      teamCache.set(cacheKey, teamMatches);
    }

    const fx =
      teamMatches.find((x) => x.id === fdMatchId) ??
      teamMatches.find(
        (x) =>
          Math.abs(new Date(x.utcDate).getTime() - new Date(m.date).getTime()) <
          12 * 3600_000
      );
    if (!fx) {
      skipped++;
      continue;
    }

    const update = { matchId: m.id };
    const status = mapStatus(fx.status);
    if (status) update.status = status;
    const ft = fx.score?.fullTime;
    if (typeof ft?.home === "number" && typeof ft?.away === "number") {
      update.score = { home: ft.home, away: ft.away };
    }
    const pk = fx.score?.penalties;
    if (typeof pk?.home === "number" && typeof pk?.away === "number") {
      update.penaltyScore = { home: pk.home, away: pk.away };
    }

    // 既存と差分が無ければスキップ
    const prev = existing[m.id] ?? {};
    const sameStatus = prev.status === update.status;
    const sameScore =
      JSON.stringify(prev.score) === JSON.stringify(update.score);
    const samePk =
      JSON.stringify(prev.penaltyScore) === JSON.stringify(update.penaltyScore);
    if (sameStatus && sameScore && samePk) {
      unchanged++;
      continue;
    }

    // フィールド単位 merge (フォーメーション・goals 等は保持)
    existing[m.id] = { ...prev, ...update };
    synced++;
    console.log(
      `  ${m.id}: ${fx.homeTeam?.tla} ${ft?.home}-${ft?.away} ${fx.awayTeam?.tla} [${fx.status}]`
    );
  }

  fs.writeFileSync(
    resultsPath,
    JSON.stringify(existing, null, 2) + "\n",
    "utf8"
  );
  console.log(`\nSynced ${synced}, unchanged ${unchanged}, skipped ${skipped}`);
  console.log(`Wrote ${resultsPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
