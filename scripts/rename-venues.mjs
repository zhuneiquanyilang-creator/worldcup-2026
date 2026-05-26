/**
 * matches.json の venue を FIFA 公式の日本語表記に統一し、国名を付加する。
 *
 * 例:
 *   "Estadio Azteca, Mexico City"
 *     → "エスタディオ・アステカ, メキシコシティ（メキシコ）"
 *   "AT&T Stadium, Arlington"
 *     → "ダラス・スタジアム, ダラス（アメリカ）"
 *
 * 出典: ja.wikipedia.org/2026 FIFAワールドカップ (FIFA 公式の大会用名称)。
 * スポンサー名 (AT&T, Mercedes-Benz, Levi's, BMO 等) は WC 大会中は使用されない
 * ため、地名ベースの大会用名称に統一。
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "matches.json");

// 旧 venue 文字列 → 新 venue 文字列 (日本語 + 国名)
const MAP = {
  // ── メキシコ ──
  "Estadio Azteca, Mexico City": "エスタディオ・アステカ, メキシコシティ（メキシコ）",
  "Estadio Guadalajara, Zapopan": "エスタディオ・グアダラハラ, グアダラハラ（メキシコ）",
  "Estadio Monterrey, Guadalupe": "エスタディオ・モンテレイ, モンテレイ（メキシコ）",
  "Estadio BBVA, Guadalupe": "エスタディオ・モンテレイ, モンテレイ（メキシコ）",

  // ── カナダ ──
  "BC Place, Vancouver": "BCプレイス, バンクーバー（カナダ）",
  "BMO Field, Toronto": "トロント・スタジアム, トロント（カナダ）",

  // ── アメリカ ──
  "MetLife Stadium, East Rutherford":
    "ニューヨーク・ニュージャージー・スタジアム, ニューヨーク/ニュージャージー（アメリカ）",
  "AT&T Stadium, Arlington": "ダラス・スタジアム, ダラス（アメリカ）",
  "Dallas Stadium, Arlington": "ダラス・スタジアム, ダラス（アメリカ）",
  "Arrowhead Stadium, Kansas City":
    "カンザスシティ・スタジアム, カンザスシティ（アメリカ）",
  "GEHA Field at Arrowhead Stadium, Kansas City":
    "カンザスシティ・スタジアム, カンザスシティ（アメリカ）",
  "Kansas City Stadium, Kansas City":
    "カンザスシティ・スタジアム, カンザスシティ（アメリカ）",
  "NRG Stadium, Houston": "ヒューストン・スタジアム, ヒューストン（アメリカ）",
  "Houston Stadium, Houston": "ヒューストン・スタジアム, ヒューストン（アメリカ）",
  "SoFi Stadium, Inglewood": "ロサンゼルス・スタジアム, ロサンゼルス（アメリカ）",
  "Los Angeles Stadium, Inglewood":
    "ロサンゼルス・スタジアム, ロサンゼルス（アメリカ）",
  "Levi's Stadium, Santa Clara":
    "サンフランシスコ・ベイエリア・スタジアム, サンフランシスコ・ベイエリア（アメリカ）",
  "Lumen Field, Seattle": "シアトル・スタジアム, シアトル（アメリカ）",
  "Seattle Stadium, Seattle": "シアトル・スタジアム, シアトル（アメリカ）",
  "Gillette Stadium, Foxboro": "ボストン・スタジアム, ボストン（アメリカ）",
  "Hard Rock Stadium, Miami Gardens": "マイアミ・スタジアム, マイアミ（アメリカ）",
  "Miami Stadium, Miami Gardens": "マイアミ・スタジアム, マイアミ（アメリカ）",
  "Lincoln Financial Field, Philadelphia":
    "フィラデルフィア・スタジアム, フィラデルフィア（アメリカ）",
  "Mercedes-Benz Stadium, Atlanta":
    "アトランタ・スタジアム, アトランタ（アメリカ）",
  "Atlanta Stadium, Atlanta": "アトランタ・スタジアム, アトランタ（アメリカ）",

  // ── テスト試合（イングランドのクラブ会場）──
  "Stamford Bridge, London":
    "スタンフォード・ブリッジ, ロンドン（イングランド）",
  "American Express Stadium, Falmer":
    "アメリカン・エクスプレス・スタジアム, ファルマー（イングランド）",
};

const raw = await readFile(FILE, "utf8");
const matches = JSON.parse(raw);

const stats = { replaced: 0, skipped: 0, unknown: new Set() };
for (const m of matches) {
  if (!m.venue || m.venue === "未定") {
    stats.skipped++;
    continue;
  }
  const ja = MAP[m.venue];
  if (!ja) {
    stats.unknown.add(m.venue);
    continue;
  }
  if (m.venue !== ja) {
    m.venue = ja;
    stats.replaced++;
  }
}

if (stats.unknown.size > 0) {
  console.error("以下の venue は MAP に未登録:");
  for (const v of stats.unknown) console.error("  -", v);
  process.exit(1);
}

// matches.json は1試合1行のコンパクト形式なので元の構造を保つ
// JSON.stringify (indent 2) は1試合複数行になってしまうため、
// 元のコンパクト形式に揃えて手動シリアライズする
function compactSerialize(arr) {
  const lines = ["["];
  let prevStage = null;
  for (let i = 0; i < arr.length; i++) {
    const m = arr[i];
    // ステージが変わるところに空行を入れる (元の形式に合わせる)
    if (prevStage !== null && m.stage !== prevStage) lines.push("");
    if (i === 0) prevStage = m.stage;
    const json = JSON.stringify(m);
    const comma = i < arr.length - 1 ? "," : "";
    lines.push(`  ${json}${comma}`);
    prevStage = m.stage;
  }
  lines.push("]");
  return lines.join("\n") + "\n";
}

await writeFile(FILE, compactSerialize(matches), "utf8");
console.log(`置換完了: ${stats.replaced} 試合の venue を更新 / ${stats.skipped} 試合をスキップ`);
