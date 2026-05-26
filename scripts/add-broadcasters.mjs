/**
 * matches.json の各試合に broadcasters: string[] を付与する。
 *
 * 出典: FIFA 公式 https://www.fifa.com/ja/tournaments/mens/worldcup/canadamexicousa2026/scores-fixtures?country=JP
 *       (2026-05-26 取得、ユーザー提供スクリーンショット経由)
 *
 * コード: "nhk-g" | "nhk-bs1" | "nhk-bs4k" | "ntv" | "fuji" | "dazn"
 *   - nhk-g  : NHK 総合
 *   - nhk-bs1: NHK BS1
 *   - nhk-bs4k: NHK BS4K
 *   - ntv    : 日本テレビ
 *   - fuji   : フジテレビ
 *   - dazn   : DAZN (全 104 試合を独占配信)
 *
 * DAZN は WC2026 全試合をストリーミング配信するため m001〜m104 すべてに自動付与する。
 * テスト試合 (EPL) には付けない。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "matches.json");

// matchId -> broadcaster code 配列
const MAP = {
  // ── Group A ──
  m001: ["nhk-g", "nhk-bs4k"], // MEX vs ZAF
  m003: ["ntv"],                // CZE vs ZAF
  m004: ["nhk-g", "nhk-bs4k"], // MEX vs KOR

  // ── Group B ──
  m007: ["nhk-g", "nhk-bs4k"], // CAN vs BIH
  m011: ["nhk-g", "nhk-bs4k"], // SUI vs CAN

  // ── Group C ──
  m014: ["nhk-g", "nhk-bs4k"], // HAI vs SCO
  m015: ["fuji"],               // SCO vs MAR
  m016: ["nhk-g", "nhk-bs4k"], // BRA vs HAI

  // ── Group D ──
  m020: ["ntv"],                // AUS vs TUR
  m021: ["nhk-g", "nhk-bs4k"], // USA vs AUS
  m023: ["ntv"],                // TUR vs USA

  // ── Group E ──
  m027: ["ntv"],                // GER vs CIV

  // ── Group F ──
  m031: ["nhk-g", "nhk-bs4k"], // NED vs JPN
  m032: ["ntv"],                // SWE vs TUN
  m033: ["nhk-g", "nhk-bs4k"], // NED vs SWE
  m034: ["ntv", "nhk-bs1"],   // TUN vs JPN
  m035: ["nhk-g", "nhk-bs4k"], // JPN vs SWE

  // ── Group G ──
  m037: ["nhk-g", "nhk-bs4k"], // BEL vs EGY
  m042: ["ntv"],                // NZL vs BEL

  // ── Group H ──
  m043: ["nhk-g", "nhk-bs4k"], // ESP vs CPV
  m045: ["nhk-g", "nhk-bs4k"], // ESP vs KSA
  m048: ["ntv"],                // URU vs ESP

  // ── Group I ──
  m049: ["fuji"],               // FRA vs SEN
  m052: ["nhk-g", "nhk-bs4k"], // NOR vs SEN
  m053: ["nhk-g", "nhk-bs4k"], // NOR vs FRA

  // ── Group J ──
  m055: ["nhk-g", "nhk-bs4k"], // ARG vs ALG
  m060: ["nhk-g", "nhk-bs4k"], // JOR vs ARG

  // ── Group K ──
  m061: ["fuji"],               // POR vs COD
  m063: ["nhk-g", "nhk-bs4k"], // POR vs UZB
  m064: ["ntv"],                // COL vs COD
  m065: ["fuji"],               // COL vs POR

  // ── Group L ──
  m070: ["fuji"],               // PAN vs CRO

  // ── R32 ──
  m078: ["ntv"], // GE2 vs GI2 (Dallas)
  m083: ["ntv"], // GK2 vs GL2 (Toronto)
  m086: ["ntv"], // GJ1 vs GH2 (Miami)
};

const raw = await readFile(FILE, "utf8");
const matches = JSON.parse(raw);

let added = 0;
let cleared = 0;
for (const m of matches) {
  // テスト試合は対象外
  if (m.stage === "test") {
    if (m.broadcasters) {
      delete m.broadcasters;
      cleared++;
    }
    continue;
  }
  const extra = MAP[m.id] ?? [];
  // 全 WC 試合に DAZN を付ける。FIFA のテレビ局アイコンがある試合はそれを先頭に並べ、
  // DAZN を末尾に置く (FIFA サイトの並び順: 放送局 → DAZN ▶ → チケット 順に倣う)。
  m.broadcasters = [...extra, "dazn"];
  added++;
}

// matches.json は 1試合1行のコンパクト形式。ステージ境界で空行を入れる
function fmtObj(m) {
  const entries = Object.entries(m).map(
    ([k, v]) => `"${k}": ${JSON.stringify(v)}`
  );
  return `{ ${entries.join(", ")} }`;
}

const lines = ["["];
let prevStage = null;
for (let i = 0; i < matches.length; i++) {
  const m = matches[i];
  if (prevStage !== null && m.stage !== prevStage) lines.push("");
  prevStage = m.stage;
  lines.push("  " + fmtObj(m) + (i < matches.length - 1 ? "," : ""));
}
lines.push("]");
await writeFile(FILE, lines.join("\n") + "\n", "utf8");

console.log(`broadcasters 付与: ${added} 試合 / 削除: ${cleared} 試合`);
