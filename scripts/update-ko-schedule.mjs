/**
 * matches.json の R16 以降 (m089〜m104) の date / venue を確定値に更新する。
 *
 * 出典: en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage (2026-05-26 取得)。
 *       venue 日本語表記は matches.json で既に確立されている FIFA 大会用名称に揃える。
 *
 * 試合番号と対戦ペアの対応は matches.json の既存値を尊重 (chronological vs bracket numbering の
 * 食い違いを避けるため、team pair で venue/date を引き当てる)。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "matches.json");

// matchId -> { date, venue }
const UPDATES = {
  // ── R16 ──
  m089: { // W73 vs W75
    date: "2026-07-04T12:00:00-05:00",
    venue: "ヒューストン・スタジアム（アメリカ）",
  },
  m090: { // W74 vs W77
    date: "2026-07-04T17:00:00-04:00",
    venue: "フィラデルフィア・スタジアム（アメリカ）",
  },
  m091: { // W76 vs W78
    date: "2026-07-05T16:00:00-04:00",
    venue: "ニューヨーク・ニュージャージー・スタジアム（アメリカ）",
  },
  m092: { // W79 vs W80
    date: "2026-07-05T18:00:00-06:00",
    venue: "エスタディオ・アステカ（メキシコ）",
  },
  m093: { // W83 vs W84
    date: "2026-07-06T14:00:00-05:00",
    venue: "ダラス・スタジアム（アメリカ）",
  },
  m094: { // W81 vs W82
    date: "2026-07-06T17:00:00-07:00",
    venue: "シアトル・スタジアム（アメリカ）",
  },
  m095: { // W86 vs W88
    date: "2026-07-07T12:00:00-04:00",
    venue: "アトランタ・スタジアム（アメリカ）",
  },
  m096: { // W85 vs W87
    date: "2026-07-07T13:00:00-07:00",
    venue: "BCプレイス（カナダ）",
  },

  // ── QF ──
  m097: { // W89 vs W90
    date: "2026-07-09T16:00:00-04:00",
    venue: "ボストン・スタジアム（アメリカ）",
  },
  m098: { // W91 vs W92
    date: "2026-07-11T17:00:00-04:00",
    venue: "マイアミ・スタジアム（アメリカ）",
  },
  m099: { // W93 vs W94
    date: "2026-07-10T12:00:00-07:00",
    venue: "ロサンゼルス・スタジアム（アメリカ）",
  },
  m100: { // W95 vs W96
    date: "2026-07-11T20:00:00-05:00",
    venue: "カンザスシティ・スタジアム（アメリカ）",
  },

  // ── SF ──
  m101: { // W97 vs W98
    date: "2026-07-14T14:00:00-05:00",
    venue: "ダラス・スタジアム（アメリカ）",
  },
  m102: { // W99 vs W100
    date: "2026-07-15T15:00:00-04:00",
    venue: "アトランタ・スタジアム（アメリカ）",
  },

  // ── 3位決定戦 ──
  m103: {
    date: "2026-07-18T17:00:00-04:00",
    venue: "マイアミ・スタジアム（アメリカ）",
  },

  // ── 決勝 ──
  m104: {
    date: "2026-07-19T15:00:00-04:00",
    venue: "ニューヨーク・ニュージャージー・スタジアム（アメリカ）",
  },
};

const raw = await readFile(FILE, "utf8");
const matches = JSON.parse(raw);

let updated = 0;
for (const m of matches) {
  const u = UPDATES[m.id];
  if (!u) continue;
  m.date = u.date;
  m.venue = u.venue;
  updated++;
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

console.log(`R16以降の日時・会場を更新: ${updated} 試合`);
