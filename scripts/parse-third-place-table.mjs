/**
 * Wikipedia 「Template:2026 FIFAワールドカップ・3位組み合わせ表」の wikitext を
 * パースし、3位チームの R32 スロット割り当て表を JSON 化する。
 *
 * 出典: https://ja.wikipedia.org/wiki/Template:2026_FIFAワールドカップ・3位組み合わせ表
 *       元データは大会規則 付属書C (Annex C of the Tournament Regulations)
 *
 * 入力: scripts/wikitext_3rd_place.txt （MediaWiki API で事前ダウンロード）
 * 出力: public/data/third_place_assignment.json
 *
 * テーブル構造:
 *  - 12 列の各グループ (A〜L) — 「該当グループの3位が R32 進出するか」を示す。
 *    値あり (該当グループ文字) ＝進出 / 空＝落選 (落選は 4 グループ分=12-8)
 *  - 8 列のスロット (1A vs / 1B vs / 1D vs / 1E vs / 1G vs / 1I vs / 1K vs / 1L vs)
 *    1A → m079 (A組1位の対戦カード)、1B → m085 ... のマッピング
 *  - 合計 495 行 = C(12,8) の組み合わせ全て
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const IN = join(HERE, "wikitext_3rd_place.txt");
const OUT = join(ROOT, "public", "data", "third_place_assignment.json");

const SLOT_ORDER = ["1A", "1B", "1D", "1E", "1G", "1I", "1K", "1L"];
const SLOT_TO_MATCH = {
  "1A": "m079",
  "1B": "m085",
  "1D": "m081",
  "1E": "m074",
  "1G": "m082",
  "1I": "m077",
  "1K": "m087",
  "1L": "m080",
};
const GROUPS = "ABCDEFGHIJKL";

const wt = await readFile(IN, "utf8");
// Split on row separators "|-"
const chunks = wt.split(/\n\|-+\s*\n/);

const lookup = {};
let parsed = 0;
let lastRow = 0;

for (const chunk of chunks) {
  const rowMatch = chunk.match(/! scope="row" \| (\d+)/);
  if (!rowMatch) continue;
  const rowNum = parseInt(rowMatch[1], 10);

  // Keep only cell lines (those starting with "|"), drop header (`!`) lines
  const lines = chunk
    .split("\n")
    .filter((l) => l.startsWith("|") && !l.startsWith("|-") && !l.startsWith("|}"));

  // Each line: strip leading "|", split by "||"
  const cells = [];
  for (const line of lines) {
    const raw = line.replace(/^\|\s*/, "");
    const lineCells = raw.split(/\s*\|\|\s*/);
    cells.push(...lineCells);
  }

  const clean = cells.map((c) => c.replace(/'''/g, "").trim());

  if (clean.length !== 20) {
    console.error(`Row ${rowNum}: expected 20 cells, got ${clean.length}: ${JSON.stringify(clean)}`);
    continue;
  }

  const qualifying = [];
  for (let i = 0; i < 12; i++) {
    if (clean[i] !== "") qualifying.push(GROUPS[i]);
  }
  if (qualifying.length !== 8) {
    console.error(`Row ${rowNum}: qualifying count = ${qualifying.length}, expected 8`);
    continue;
  }

  const slots = {};
  for (let i = 0; i < 8; i++) {
    const slot = SLOT_ORDER[i];
    const match = SLOT_TO_MATCH[slot];
    const value = clean[12 + i]; // "3X"
    const group = value.replace(/^3/, "").trim();
    if (group.length !== 1 || !GROUPS.includes(group)) {
      console.error(`Row ${rowNum} slot ${slot}: bad value "${value}"`);
    }
    slots[match] = group;
  }

  const key = qualifying.sort().join("");
  if (lookup[key]) {
    console.error(`Duplicate key ${key} at row ${rowNum}`);
  }
  lookup[key] = slots;
  parsed++;
  lastRow = Math.max(lastRow, rowNum);
}

console.log(`Parsed rows: ${parsed} / expected 495 (last row #${lastRow})`);
console.log(`Unique keys: ${Object.keys(lookup).length}`);

const out = {
  _comment:
    "FIFA 2026 R32 3位チーム組合せ表。Wikipedia から取得し parse-third-place-table.mjs で生成。",
  _source:
    "https://ja.wikipedia.org/wiki/Template:2026_FIFAワールドカップ・3位組み合わせ表",
  _fetchedAt: new Date().toISOString().slice(0, 10),
  _slotToMatch: SLOT_TO_MATCH,
  _key: "進出8グループをアルファベット順に並べた8文字 (例: \"DEFGHIJKL\")",
  combinations: lookup,
};

await writeFile(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`Wrote ${OUT}`);
