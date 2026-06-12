// Football-Data.org の matchId → 自前 matches.json の m001..m104 の対応表を生成。
// dev サーバー (npm run dev) を立てた状態で実行する:
//
//   node scripts/build-footballdata-mapping.mjs
//
// dev サーバー経由で /football-data-api/competitions/WC/matches を取得 (キーは
// vite.config.ts のヘッダ差し込みが入る)。
//
// 照合: 日付 ± 12h + 両チーム名 (英語) → 自前 teams.json の nameEn / FIFA TLA。
// 出力: public/data/footballdata_mapping.json

import fs from "fs";
import path from "path";

const DEV = "http://localhost:5173";

const matchesPath = path.resolve("public/data/matches.json");
const teamsPath = path.resolve("public/data/teams.json");
const outPath = path.resolve("public/data/footballdata_mapping.json");

const matches = JSON.parse(fs.readFileSync(matchesPath, "utf8"));
const teams = JSON.parse(fs.readFileSync(teamsPath, "utf8"));

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
  if (t.id) nameToTeamId.set(norm(t.id), t.id);
}

// 英語名/TLA の表記ゆれ
const ALIAS = {
  unitedstates: "USA",
  usa: "USA",
  korearepublic: "KOR",
  republicofkorea: "KOR",
  southkorea: "KOR",
  korearep: "KOR",
  southafrica: "ZAF",
  rsa: "ZAF",
  ivorycoast: "CIV",
  cotedivoire: "CIV",
  cotedlvoire: "CIV",
  capeverde: "CPV",
  caboverde: "CPV",
  saudiarabia: "KSA",
  ksa: "KSA",
  congodr: "COD",
  drcongo: "COD",
  democraticrepublicofcongo: "COD",
  curacao: "CUW",
  cuw: "CUW",
  bosniaandherzegovina: "BIH",
  bosniaherzegovina: "BIH",
  newzealand: "NZL",
  iran: "IRN",
  irislamicrepublic: "IRN",
  islamicrepublicofiran: "IRN",
};
for (const [k, v] of Object.entries(ALIAS)) {
  if (!nameToTeamId.has(k)) nameToTeamId.set(k, v);
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`${url} → ${r.status}\n${body}`);
  }
  return r.json();
}

async function main() {
  console.log("Fetching WC matches from Football-Data.org…");
  const data = await fetchJson(`${DEV}/football-data-api/competitions/WC/matches`);
  console.log(`Football-Data returned ${data.matches?.length ?? 0} matches`);
  if (!data.matches?.length) {
    console.error("Empty response. Body:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  // 日付 → ローカル試合候補のインデックス (± 1 day で許容)
  const matchByDate = new Map();
  for (const m of matches) {
    const date = new Date(m.date);
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

  for (const fx of data.matches) {
    const fxDate = new Date(fx.utcDate);
    const dayKey = fxDate.toISOString().slice(0, 10);
    const candidates = matchByDate.get(dayKey) ?? [];
    const homeName = fx.homeTeam?.name;
    const awayName = fx.awayTeam?.name;
    const homeTla = fx.homeTeam?.tla;
    const awayTla = fx.awayTeam?.tla;
    const homeId =
      nameToTeamId.get(norm(homeName)) ?? nameToTeamId.get(norm(homeTla));
    const awayId =
      nameToTeamId.get(norm(awayName)) ?? nameToTeamId.get(norm(awayTla));

    let hit = null;
    if (homeId && awayId) {
      hit = candidates.find(
        (m) =>
          (m.homeTeamId === homeId && m.awayTeamId === awayId) ||
          (m.homeTeamId === awayId && m.awayTeamId === homeId)
      );
    }

    if (hit) {
      const diff = Math.abs(new Date(hit.date).getTime() - fxDate.getTime());
      if (diff < 12 * 3600_000) {
        mapping[hit.id] = {
          fdMatchId: fx.id,
          fdHomeTeamId: fx.homeTeam?.id ?? null,
          fdAwayTeamId: fx.awayTeam?.id ?? null,
        };
        matched++;
        continue;
      }
    }
    unmatched++;
    unmatchedList.push({
      fdId: fx.id,
      date: fx.utcDate,
      teams: `${homeName} vs ${awayName}`,
      tla: `${homeTla}/${awayTla}`,
      homeMapped: homeId,
      awayMapped: awayId,
    });
  }

  // 2 段階目: チーム名が null (KO の TBD 期間) の fixture は、
  // 正確な UTC 日時で一意に紐付けられるなら照合する。
  const used = new Set(Object.keys(mapping));
  const byUtcTime = new Map();
  for (const m of matches) {
    const ts = new Date(m.date).getTime();
    if (!byUtcTime.has(ts)) byUtcTime.set(ts, []);
    byUtcTime.get(ts).push(m);
  }
  let secondPass = 0;
  for (const u of [...unmatchedList]) {
    const fxTs = new Date(u.date).getTime();
    const cand = (byUtcTime.get(fxTs) ?? []).filter((m) => !used.has(m.id));
    if (cand.length === 1) {
      // KO ステージは fd 側でも team が null (TBD) なので fdHomeTeamId/fdAwayTeamId
      // は埋められない。確定後に再生成する想定。
      mapping[cand[0].id] = {
        fdMatchId: u.fdId,
        fdHomeTeamId: null,
        fdAwayTeamId: null,
      };
      used.add(cand[0].id);
      matched++;
      unmatched--;
      secondPass++;
      const i = unmatchedList.indexOf(u);
      if (i >= 0) unmatchedList.splice(i, 1);
    }
  }
  if (secondPass > 0) console.log(`Second pass (date-only) matched: ${secondPass}`);

  console.log(`Matched: ${matched}, Unmatched: ${unmatched}`);
  if (unmatchedList.length > 0) {
    console.log("Unmatched fixtures:");
    for (const u of unmatchedList.slice(0, 20)) {
      console.log(
        `  fd=${u.fdId} ${u.date} ${u.teams} [${u.tla}] mapped=${u.homeMapped}/${u.awayMapped}`
      );
    }
    if (unmatchedList.length > 20)
      console.log(`  ...and ${unmatchedList.length - 20} more`);
  }

  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        competition: "WC",
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
