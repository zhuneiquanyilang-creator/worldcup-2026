// m002 (韓国 vs チェコ) のスタメン + ベンチを match_results.json に書き込む。
//
// 出典: ユーザー提供のスクリーンショット (Sofascore lineup page、2026-06-12)
// - 韓国 4-2-3-1
// - チェコ 4-3-3
//
// ユーザー指定:「交代は反映せず、スタート時のメンバーで」→ substitutions は触らない、
// goals/bookings も書き込まない。formation のみ。

import fs from "fs";
import path from "path";

const PATH = path.resolve("public/data/match_results.json");
const playersPath = path.resolve("public/data/players.json");
const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));

const nameByNum = new Map();
for (const p of players) {
  if (typeof p.number === "number") {
    nameByNum.set(`${p.teamId}:${p.number}`, p.name);
  }
}
function jp(teamId, number) {
  return nameByNum.get(`${teamId}:${number}`) ?? `#${number}`;
}

// レンダラ規約: 各レイヤー内で i=0 = チームの右サイド、i=N-1 = チームの左サイド。
function buildFormation(shape, lineup) {
  const parts = shape.split("-").map(Number);
  const X_MIN = 22;
  const X_MAX = 80;
  const starting = [];
  // GK
  starting.push({
    x: 8,
    y: 50,
    number: lineup[0].number,
    name: lineup[0].name,
    role: "GK",
  });
  let cursor = 1;
  const layerCount = parts.length;
  parts.forEach((count, layerIdx) => {
    const x =
      layerCount === 1
        ? (X_MIN + X_MAX) / 2
        : X_MIN + (layerIdx / (layerCount - 1)) * (X_MAX - X_MIN);
    for (let i = 0; i < count; i++) {
      const p = lineup[cursor++];
      if (!p) continue;
      const y = ((i + 0.5) / count) * 100;
      starting.push({
        x,
        y,
        number: p.number,
        name: p.name,
        role:
          layerIdx === 0
            ? "DF"
            : layerIdx === layerCount - 1
            ? "FW"
            : "MF",
      });
    }
  });
  return { shape, starting };
}

// 韓国 3-4-2-1 (GK → CB×3 → MID×4 (WB+CM+CM+WB) → AM×2 → CF×1)
// 各レイヤー右→左:
//   CB:  #2 RCB → #4 CB → #3 LCB
//   MID: #22 RWB → #6 RCM → #8 LCM → #13 LWB
//   AM:  #19 RAM → #10 LAM
//   CF:  #7 (ソン・フンミン)
const korLineup = [
  { number: 1, name: jp("KOR", 1) }, // GK
  // CB
  { number: 2, name: jp("KOR", 2) }, // イ・ハンボム RCB
  { number: 4, name: jp("KOR", 4) }, // キム・ミンジェ CB
  { number: 3, name: jp("KOR", 3) }, // イ・ギヒョク LCB
  // MID (WB + CM + CM + WB)
  { number: 22, name: jp("KOR", 22) }, // ソル・ヨンウ RWB
  { number: 6, name: jp("KOR", 6) }, // ファン・インボム RCM
  { number: 8, name: jp("KOR", 8) }, // ペク・スンホ LCM
  { number: 13, name: jp("KOR", 13) }, // イ・テソク LWB
  // AM
  { number: 19, name: jp("KOR", 19) }, // イ・ガンイン RAM
  { number: 10, name: jp("KOR", 10) }, // イ・ジェソン LAM
  // CF
  { number: 7, name: jp("KOR", 7) }, // ソン・フンミン (c)
];

// 韓国 ベンチ 15名
const korBench = [
  5, 9, 11, 12, 14, 15, 16, 17, 18, 20, 21, 23, 24, 25, 26,
].map((n) => ({ number: n, name: jp("KOR", n) }));

// チェコ 3-4-2-1 (GK → CB×3 → MID×4 (WB+CM+CM+WB) → AM×2 → CF×1)
// 各レイヤー右→左 (CZE 視点 = 上から下、AWAY ↔ ホームと同じ規約):
//   CB:  #6 RCB → #4 CB → #7 LCB (主将クレイチー)
//   MID: #5 RWB ツォウファル → #22 RCM ソウチェク → #24 LCM ソイカ → #20 LWB ゼレニー
//   AM:  #17 RAM プロヴォド → #15 LAM シュルツ
//   CF:  #10 シック
const czeLineup = [
  { number: 1, name: jp("CZE", 1) }, // GK
  // CB
  { number: 6, name: jp("CZE", 6) }, // チャロウペク RCB
  { number: 4, name: jp("CZE", 4) }, // フラナーチ CB
  { number: 7, name: jp("CZE", 7) }, // クレイチー (c) LCB
  // MID
  { number: 5, name: jp("CZE", 5) }, // ツォウファル RWB
  { number: 22, name: jp("CZE", 22) }, // ソウチェク RCM
  { number: 24, name: jp("CZE", 24) }, // ソイカ LCM
  { number: 20, name: jp("CZE", 20) }, // ゼレニー LWB
  // AM
  { number: 17, name: jp("CZE", 17) }, // プロヴォド RAM
  { number: 15, name: jp("CZE", 15) }, // シュルツ LAM
  // CF
  { number: 10, name: jp("CZE", 10) }, // シック
];

// チェコ ベンチ 15名
const czeBench = [
  2, 3, 8, 9, 11, 12, 13, 14, 16, 18, 19, 21, 23, 25, 26,
].map((n) => ({ number: n, name: jp("CZE", n) }));

const homeFormation = buildFormation("3-4-2-1", korLineup);
homeFormation.bench = korBench;

const awayFormation = buildFormation("3-4-2-1", czeLineup);
awayFormation.bench = czeBench;

// 既存 match_results.json にマージ (status / score は触らない)
let existing = {};
try {
  const raw = fs.readFileSync(PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    existing = parsed;
  }
} catch {}

existing.m002 = {
  ...(existing.m002 || {}),
  matchId: "m002",
  homeFormation,
  awayFormation,
};

fs.writeFileSync(PATH, JSON.stringify(existing, null, 2) + "\n", "utf8");

console.log("Wrote m002 formations:");
console.log(" KOR 4-2-3-1:");
console.log("   " + korLineup.map((p) => `#${p.number} ${p.name}`).join(" / "));
console.log(" CZE 4-3-3:");
console.log("   " + czeLineup.map((p) => `#${p.number} ${p.name}`).join(" / "));
console.log(` Bench: KOR ${korBench.length} / CZE ${czeBench.length}`);
