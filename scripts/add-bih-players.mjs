/**
 * players.json にボスニア・ヘルツェゴビナ代表 26 名を追加する一回限りスクリプト。
 *
 * 出典: worldcdb.com/bosniaherzegovina.htm (2026-06-02 取得)。
 *
 * 表記正規化:
 *  - worldcdb は生年を 2 桁表記 (例 "95-12-02" / "06-07-17")。年が 80-99 → 19xx、
 *    00-29 → 20xx に展開する。
 *  - 海外クラブは全角「（）」に国名を併記。
 *  - Reims は RC ランス (Lens) と区別するため「スタッド・ランス」と表記。
 *  - Brøndby は worldcdb 原本が "Brøndbyvej" (通り名) と誤記されているが、ブロンビュー IF を指す。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "players.json");

const BIH = [
  // GK 3
  ["GK", "ニコラ・ヴァシリ", "1995-12-02", "ザンクト・パウリ（ドイツ）"],
  ["GK", "マルティン・ズロミシリ", "1998-08-16", "HNKリエカ（クロアチア）"],
  ["GK", "オスマン・ハジキッチ", "1996-03-12", "スラヴェン・ベルポ（クロアチア）"],
  // DF 8
  ["DF", "ステパン・ラデリッチ", "1997-09-05", "HNKリエカ（クロアチア）"],
  ["DF", "ニハド・ムヤキッチ", "1998-04-15", "ガジアンテプ（トルコ）"],
  ["DF", "ニダル・チェリッチ", "2006-07-17", "スタッド・ランス（フランス）"],
  ["DF", "アマル・デディッチ", "2002-08-18", "ベンフィカ（ポルトガル）"],
  ["DF", "ニコラ・カティッチ", "1996-10-10", "シャルケ04（ドイツ）"],
  ["DF", "デニス・ハジカドゥニッチ", "1998-07-09", "サンプドリア（イタリア）"],
  ["DF", "タリク・ムハレモビッチ", "2003-02-28", "サッスオーロ（イタリア）"],
  ["DF", "セアド・コラシナツ", "1993-06-20", "アタランタ（イタリア）"],
  // MF 10
  ["MF", "イヴァン・バシッチ", "2002-04-30", "FCアスタナ（カザフスタン）"],
  ["MF", "イヴァン・シュニッチ", "1996-10-09", "パフォスFC（キプロス）"],
  ["MF", "エルミン・マフミッチ", "2005-03-14", "スロヴァン・リベレツ（チェコ）"],
  ["MF", "アマル・メミッチ", "2001-01-20", "ヴィクトリア・プルゼニ（チェコ）"],
  ["MF", "ケリム・アライベゴビッチ", "2007-09-21", "レッドブル・ザルツブルク（オーストリア）"],
  ["MF", "アルミン・ギゴビッチ", "2002-04-06", "ヤング・ボーイズ（スイス）"],
  ["MF", "ベンヤミン・タヒロビッチ", "2003-03-03", "ブロンビュー（デンマーク）"],
  ["MF", "エスミル・バイラクタレビッチ", "2005-03-10", "PSVアイントホーフェン（オランダ）"],
  ["MF", "ジェニス・ブルニッチ", "1998-05-22", "カールスルーエ（ドイツ）"],
  ["MF", "アミル・ハジアフメトビッチ", "1997-03-08", "ハル・シティ（イングランド）"],
  // FW 5
  ["FW", "エディン・ジェコ", "1986-03-17", "シャルケ04（ドイツ）"],
  ["FW", "エルメディン・デミロビッチ", "1998-03-25", "シュトゥットガルト（ドイツ）"],
  ["FW", "ハリス・タバコビッチ", "1994-06-20", "ボルシア・メンヒェングラートバッハ（ドイツ）"],
  ["FW", "サメド・バズダル", "2004-01-31", "ヤギェロニア・ビャウィストク（ポーランド）"],
  ["FW", "ヨヴォ・ルキッチ", "1998-11-28", "ウニベルシタテア・クルジ（ルーマニア）"],
];

const COUNTRIES = [{ teamId: "BIH", idPrefix: "bih", roster: BIH }];

const raw = await readFile(FILE, "utf8");
const players = JSON.parse(raw);

let added = 0;
for (const c of COUNTRIES) {
  const existing = players.filter((p) => p.teamId === c.teamId);
  if (existing.length > 0) {
    console.warn(`skip ${c.teamId}: 既に ${existing.length} 名登録されています`);
    continue;
  }
  c.roster.forEach(([position, name, birthDate, club], i) => {
    players.push({
      id: `p_${c.idPrefix}_${i + 1}`,
      name,
      teamId: c.teamId,
      position,
      birthDate,
      club,
      goals: 0,
      assists: 0,
    });
    added++;
  });
}

function fmtPlayer(p) {
  const entries = Object.entries(p).map(
    ([k, v]) => `"${k}": ${JSON.stringify(v)}`
  );
  return `{ ${entries.join(", ")} }`;
}

const lines = ["["];
let prevTeam = null;
for (let i = 0; i < players.length; i++) {
  const p = players[i];
  if (prevTeam !== null && p.teamId !== prevTeam) lines.push("");
  prevTeam = p.teamId;
  lines.push("  " + fmtPlayer(p) + (i < players.length - 1 ? "," : ""));
}
lines.push("]");
await writeFile(FILE, lines.join("\n") + "\n", "utf8");

console.log(`追加: ${added} 名 / 総数: ${players.length} 名`);
