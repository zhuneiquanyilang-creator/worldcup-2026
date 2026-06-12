// public/data/players.json を国ごとに分割して public/data/players/{teamId}.json に書き出す。
// 1 回だけ実行する想定 (以後は per-team ファイルが正本)。
//
// 使い方:
//   node scripts/split-players.mjs

import fs from "fs";
import path from "path";

const SRC = path.resolve("public/data/players.json");
const DIR = path.resolve("public/data/players");

if (!fs.existsSync(SRC)) {
  console.error(`source not found: ${SRC}`);
  process.exit(1);
}

const players = JSON.parse(fs.readFileSync(SRC, "utf8"));
const byTeam = new Map();
for (const p of players) {
  if (!p.teamId) {
    console.warn("player without teamId:", p);
    continue;
  }
  const arr = byTeam.get(p.teamId) ?? [];
  arr.push(p);
  byTeam.set(p.teamId, arr);
}

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

for (const [teamId, arr] of byTeam.entries()) {
  // 背番号昇順 (未設定は末尾)
  arr.sort((a, b) => (a.number ?? 999) - (b.number ?? 999));
  const out = path.join(DIR, `${teamId}.json`);
  fs.writeFileSync(out, JSON.stringify(arr, null, 2) + "\n", "utf8");
}

console.log(`Wrote ${byTeam.size} team files (total ${players.length} players) to ${DIR}`);
