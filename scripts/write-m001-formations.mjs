// 開幕戦 (m001 メキシコ vs 南アフリカ) のフォーメーション + ベンチを
// match_results.json に直接書き込むスクリプト。
//
// 出典: ユーザー提供のスクリーンショット (Sofascore lineup page, 2026-06-12)
// - メキシコ 4-1-4-1
// - 南アフリカ 5-3-2

import fs from "fs";
import path from "path";

const PATH = path.resolve("public/data/match_results.json");
const playersPath = path.resolve("public/data/players.json");
const players = JSON.parse(fs.readFileSync(playersPath, "utf8"));

// (teamId, number) → 日本語名
const nameByNum = new Map();
for (const p of players) {
  if (typeof p.number === "number") {
    nameByNum.set(`${p.teamId}:${p.number}`, p.name);
  }
}
function jp(teamId, number) {
  return nameByNum.get(`${teamId}:${number}`) ?? `#${number}`;
}

// shape 文字列から各層の x/y を等間隔生成 (utils/formation.ts と同じロジック)
function buildFormation(shape, lineup) {
  const parts = shape.split("-").map(Number);
  // src/utils/formation.ts と同期: GK と最終ラインのラベルが被らないよう内寄せ
  const X_MIN = 28;
  const X_MAX = 80;
  const starting = [];

  // GK は lineup[0]
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

// メキシコ 4-1-4-1 (GK → DF×4 → DM×1 → MF×4 → FW×1)
//
// レンダラの規約: 各レイヤー内で i=0 (最小 y) = チームの右サイド、i=N-1 (最大 y) = 左サイド。
// したがって各レイヤーで「右サイド→左サイド」の順に並べる。
const mexLineup = [
  { number: 1, name: jp("MEX", 1) }, // ランヘル GK
  // DEF (右→左)
  { number: 26, name: jp("MEX", 26) }, // グティエレス RB
  { number: 3, name: jp("MEX", 3) }, // モンテス (c) RCB
  { number: 5, name: jp("MEX", 5) }, // バスケス LCB
  { number: 23, name: jp("MEX", 23) }, // ガジャルド LB
  // DM
  { number: 6, name: jp("MEX", 6) }, // リラ
  // MF×4 (右→左)
  { number: 15, name: jp("MEX", 15) }, // レジェス RM
  { number: 25, name: jp("MEX", 25) }, // アルバラード RCM
  { number: 8, name: jp("MEX", 8) }, // フィダルゴ LCM
  { number: 16, name: jp("MEX", 16) }, // キニョネス LM
  // FW
  { number: 9, name: jp("MEX", 9) }, // R.ヒメネス CF
];

const mexBench = [
  12, 13, 2, 7, 20, 10, 21, 4, 19, 24, 18, 17, 14, 22, 11,
].map((n) => ({ number: n, name: jp("MEX", n) }));

// 南アフリカ 5-3-2 (GK → DF×5 → MF×3 → FW×2)
// 同じ規約: 各レイヤーで「右サイド→左サイド」の順。
const zafLineup = [
  { number: 1, name: jp("ZAF", 1) }, // ウィリアムズ (c) GK
  // DEF×5: RWB → RCB → CB → LCB → LWB
  { number: 20, name: jp("ZAF", 20) }, // ムダウ RWB
  { number: 4, name: jp("ZAF", 4) }, // モコエナ RCB
  { number: 21, name: jp("ZAF", 21) }, // オコン CB
  { number: 14, name: jp("ZAF", 14) }, // ムボカジ LCB
  { number: 6, name: jp("ZAF", 6) }, // モディバ LWB
  // MF×3 (右→左)
  { number: 23, name: jp("ZAF", 23) }, // アダムス
  { number: 19, name: jp("ZAF", 19) }, // シビシ
  { number: 13, name: jp("ZAF", 13) }, // シトレ
  // FW×2 (右→左)
  { number: 15, name: jp("ZAF", 15) }, // レイナーズ
  { number: 9, name: jp("ZAF", 9) }, // フォスター
];

const zafBench = [
  22, 16, 26, 3, 24, 18, 2, 7, 8, 10, 25, 5, 11, 12, 17,
].map((n) => ({ number: n, name: jp("ZAF", n) }));

const homeFormation = buildFormation("4-1-4-1", mexLineup);
homeFormation.bench = mexBench;

const awayFormation = buildFormation("5-3-2", zafLineup);
awayFormation.bench = zafBench;

// 既存 match_results.json にマージ (他の試合は壊さない)
let existing = {};
try {
  const raw = fs.readFileSync(PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    existing = parsed;
  }
} catch {}

existing.m001 = {
  ...(existing.m001 || {}),
  matchId: "m001",
  homeFormation,
  awayFormation,
};

fs.writeFileSync(PATH, JSON.stringify(existing, null, 2) + "\n", "utf8");

console.log("Wrote m001 formations to match_results.json");
console.log(" Home (MEX 4-1-4-1):", mexLineup.map((p) => `#${p.number} ${p.name}`).join(" / "));
console.log(" Away (ZAF 5-3-2):", zafLineup.map((p) => `#${p.number} ${p.name}`).join(" / "));
console.log(" Bench MEX:", mexBench.length, "Bench ZAF:", zafBench.length);
