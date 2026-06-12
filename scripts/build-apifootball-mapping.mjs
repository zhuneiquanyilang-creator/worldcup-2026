// API-Football (api-sports.io) の fixture ID → 自前 matches.json の m001..m104 の
// 対応表を生成する。dev サーバー (npm run dev) を立てた状態で実行する:
//
//   node scripts/build-apifootball-mapping.mjs
//
// dev サーバー経由で /api-football/fixtures?league=1&season=2026 を取得 (キーは
// vite.config.ts のヘッダ差し込みが入る)。Node から直接 v3.football.api-sports.io
// を叩いてもキーが付かないので必ず dev 経由。
//
// アルゴリズム:
//   1. WC 2026 (league=1, season=2026) の全 fixture を取得
//   2. matches.json のローカル試合と「日付 ± 2h + 両チーム名 (英語) 」で照合
//   3. 一致したら m??? → fixture.id を mapping に積む
//   4. apifootball_mapping.json に書き出し
//
// W 杯のリーグ ID は API-Football で `1`、シーズンは大会開幕年。

import fs from "fs";
import path from "path";

const DEV = "http://localhost:5173";
const LEAGUE = 1; // FIFA World Cup
const SEASON = 2026;

const matchesPath = path.resolve("public/data/matches.json");
const teamsPath = path.resolve("public/data/teams.json");
const outPath = path.resolve("public/data/apifootball_mapping.json");

const matches = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
const teams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));

// API-Football は英語チーム名で来るので、teams.json の nameEn でひもづける。
// 名前ゆれ吸収のため normalize して比較する。
function norm(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
const nameToTeamId = new Map();
for (const t of teams) {
  if (t.nameEn) nameToTeamId.set(norm(t.nameEn), t.id);
}

// 英語名のゆれ追加マップ (必要に応じて手で追加)
const ALIAS = {
  unitedstates: "USA",
  usa: "USA",
  unitedstatesofamerica: "USA",
  southkorea: "KOR",
  republicofkorea: "KOR",
  korearepublic: "KOR",
  southafrica: "ZAF",
  ivorycoast: "CIV",
  cotedivoire: "CIV",
  capeverde: "CPV",
  caboverde: "CPV",
  saudiarabia: "KSA",
  congodr: "COD",
  drcongo: "COD",
  democraticrepublicofcongo: "COD",
  curacao: "CUW",
  bosniaandherzegovina: "BIH",
  bosniaherzegovina: "BIH",
  newzealand: "NZL",
  iran: "IRN",
  irislamicrepublic: "IRN",
};
for (const [k, v] of Object.entries(ALIAS)) {
  if (!nameToTeamId.has(k)) nameToTeamId.set(k, v);
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

async function main() {
  console.log("Fetching WC 2026 fixtures from API-Football…");
  const data = await fetchJson(
    `${DEV}/api-football/fixtures?league=${LEAGUE}&season=${SEASON}`
  );
  console.log(`API-Football returned ${data.response?.length ?? 0} fixtures`);
  if (!data.response?.length) {
    console.error("Empty response. Body:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  // 日付 → ローカル試合候補のインデックス
  const matchByDate = new Map(); // "YYYY-MM-DD" → Match[]
  for (const m of matches) {
    const date = new Date(m.date);
    // 取得側 (UTC) で日付ずれが出ないよう、KO ±12h の幅を持たせる
    for (let offset = -1; offset <= 1; offset++) {
      const d = new Date(date.getTime() + offset * 86400 * 1000);
      const key = d.toISOString().slice(0, 10);
      if (!matchByDate.has(key)) matchByDate.set(key, []);
      matchByDate.get(key).push(m);
    }
  }

  const mapping = {};
  let matched = 0;
  let unmatched = 0;
  const unmatchedList = [];

  for (const fx of data.response) {
    const fxDate = new Date(fx.fixture.date);
    const dayKey = fxDate.toISOString().slice(0, 10);
    const candidates = matchByDate.get(dayKey) ?? [];
    const homeName = fx.teams?.home?.name;
    const awayName = fx.teams?.away?.name;
    const homeId = nameToTeamId.get(norm(homeName));
    const awayId = nameToTeamId.get(norm(awayName));

    // チーム ID で照合 (両方確定している場合のみ高精度)
    let hit = null;
    if (homeId && awayId) {
      hit = candidates.find(
        (m) =>
          (m.homeTeamId === homeId && m.awayTeamId === awayId) ||
          (m.homeTeamId === awayId && m.awayTeamId === homeId)
      );
    }

    if (hit) {
      // KO 時刻 ±2h 以内に絞る (同一カードが複数日にまたがる可能性は実質ゼロだが念のため)
      const diff = Math.abs(new Date(hit.date).getTime() - fxDate.getTime());
      if (diff < 12 * 3600_000) {
        mapping[hit.id] = fx.fixture.id;
        matched++;
        continue;
      }
    }
    unmatched++;
    unmatchedList.push({
      fixtureId: fx.fixture.id,
      date: fx.fixture.date,
      teams: `${homeName} vs ${awayName}`,
      homeMapped: homeId,
      awayMapped: awayId,
    });
  }

  console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
  if (unmatchedList.length > 0) {
    console.log("Unmatched fixtures:");
    for (const u of unmatchedList.slice(0, 20)) {
      console.log(`  fx=${u.fixtureId} ${u.date} ${u.teams}` +
        (u.homeMapped && u.awayMapped ? "" : "  (alias 不足?)"));
    }
    if (unmatchedList.length > 20) console.log(`  ...and ${unmatchedList.length - 20} more`);
  }

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        league: LEAGUE,
        season: SEASON,
        generatedAt: new Date().toISOString(),
        mapping,
      },
      null,
      2
    ) + "\n"
  );
  console.log(`Wrote ${outPath} (${Object.keys(mapping).length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
