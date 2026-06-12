// 開幕戦 m001 (メキシコ 2-0 南アフリカ) のゴール・カード・交代を
// match_results.json に書き込む。
//
// 出典: ユーザー提供のスクリーンショット (Sofascore タイムライン、2026-06-12)
//
// (teamId, number) → playerId, 日本語名を players.json から引いて埋める。

import fs from "fs";
import path from "path";

const playersPath = path.resolve("public/data/players.json");
const resultsPath = path.resolve("public/data/match_results.json");
const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));

const byTeamNum = new Map();
for (const p of players) {
  if (typeof p.number === "number") {
    byTeamNum.set(`${p.teamId}:${p.number}`, p);
  }
}
function lookup(teamId, number) {
  const p = byTeamNum.get(`${teamId}:${number}`);
  if (!p) throw new Error(`unknown ${teamId} #${number}`);
  return p;
}

const MEX = "MEX";
const ZAF = "ZAF";

const goals = [
  // 9' MEX キニョネス (assist リラ)
  {
    minute: 9,
    teamId: MEX,
    scorer: lookup(MEX, 16), // Julián Quiñones
    assist: lookup(MEX, 6), // Érik Lira
    type: "normal",
  },
  // 67' MEX ヒメネス (assist アルバラード)
  {
    minute: 67,
    teamId: MEX,
    scorer: lookup(MEX, 9), // Raúl Jiménez
    assist: lookup(MEX, 25), // Roberto Alvarado
    type: "normal",
  },
].map((g) => ({
  minute: g.minute,
  teamId: g.teamId,
  playerId: g.scorer.id,
  playerName: g.scorer.name,
  assistPlayerId: g.assist.id,
  assistPlayerName: g.assist.name,
  type: g.type,
}));

const bookings = [
  // 17' ZAF Teboho Mokoena Y
  { minute: 17, teamId: ZAF, p: lookup(ZAF, 4), type: "Y" },
  // 23' MEX Brian Gutiérrez Y
  { minute: 23, teamId: MEX, p: lookup(MEX, 26), type: "Y" },
  // 50' ZAF "Yaya" Sithole R (= #13 Sphephelo Sithole)
  { minute: 50, teamId: ZAF, p: lookup(ZAF, 13), type: "R" },
  // 74' ZAF Nkosinathi Sibisi Y
  { minute: 74, teamId: ZAF, p: lookup(ZAF, 19), type: "Y" },
  // 84' ZAF Themba Zwane R (サブ出場後)
  { minute: 84, teamId: ZAF, p: lookup(ZAF, 11), type: "R" },
  // 90+1' MEX César Montes R
  { minute: 91, teamId: MEX, p: lookup(MEX, 3), type: "R" },
].map((b) => ({
  minute: b.minute,
  teamId: b.teamId,
  playerName: b.p.name,
  type: b.type,
}));

const substitutions = [
  // 56' ZAF IN Mbatha (5) / OUT Foster (9)
  { minute: 56, teamId: ZAF, in: lookup(ZAF, 5), out: lookup(ZAF, 9) },
  // 61' ZAF IN Zwane (11) / OUT Adams (23)
  { minute: 61, teamId: ZAF, in: lookup(ZAF, 11), out: lookup(ZAF, 23) },
  // 66' MEX OUT Gutiérrez (26) / IN L. Chávez (24)
  { minute: 66, teamId: MEX, in: lookup(MEX, 24), out: lookup(MEX, 26) },
  // 66' MEX OUT Fidalgo (8) / IN Mora (19)
  { minute: 66, teamId: MEX, in: lookup(MEX, 19), out: lookup(MEX, 8) },
  // 76' MEX OUT Lira (6) / IN Álvarez (4)
  { minute: 76, teamId: MEX, in: lookup(MEX, 4), out: lookup(MEX, 6) },
  // 76' MEX OUT Jiménez (9) / IN A. González (14)
  { minute: 76, teamId: MEX, in: lookup(MEX, 14), out: lookup(MEX, 9) },
  // 76' ZAF IN Makgopa (17) / OUT Rayners (15)
  { minute: 76, teamId: ZAF, in: lookup(ZAF, 17), out: lookup(ZAF, 15) },
  // 77' ZAF IN Appollis (7) / OUT Modiba (6)
  { minute: 77, teamId: ZAF, in: lookup(ZAF, 7), out: lookup(ZAF, 6) },
  // 79' MEX OUT Quiñones (16) / IN Vega (10)
  { minute: 79, teamId: MEX, in: lookup(MEX, 10), out: lookup(MEX, 16) },
].map((s) => ({
  minute: s.minute,
  teamId: s.teamId,
  inName: s.in.name,
  outName: s.out.name,
}));

// 既存 match_results.json と field-level merge
const existing = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
existing.m001 = {
  ...(existing.m001 || {}),
  matchId: "m001",
  status: "finished",
  score: { home: 2, away: 0 },
  goals,
  bookings,
  substitutions,
};
fs.writeFileSync(resultsPath, JSON.stringify(existing, null, 2) + "\n", "utf8");

console.log("Wrote m001 events:");
console.log(`  goals: ${goals.length}`);
console.log(`  bookings: ${bookings.length}`);
console.log(`  substitutions: ${substitutions.length}`);
console.log();
console.log("Goals:");
for (const g of goals) {
  console.log(`  ${g.minute}' ${g.teamId} ${g.playerName} (A: ${g.assistPlayerName})`);
}
console.log("Bookings:");
for (const b of bookings) {
  console.log(`  ${b.minute}' ${b.teamId} ${b.playerName} ${b.type}`);
}
console.log("Substitutions:");
for (const s of substitutions) {
  console.log(`  ${s.minute}' ${s.teamId} IN: ${s.inName} / OUT: ${s.outName}`);
}
