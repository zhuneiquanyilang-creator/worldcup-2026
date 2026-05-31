/**
 * players.json にオーストラリア代表 26 名を追加する一回限りスクリプト。
 *
 * 出典: worldcdb.com/australia.htm (2026-06-01 取得)。
 *
 * 表記正規化: worldcdb の半角 "()" は既存規約の全角「（）」に揃える。
 *   国内クラブ (A-League: メルボルン・シティ / シドニーFC / メルボルン・ビクトリー) はカッコなし。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "players.json");

const AUS = [
  // GK 3
  ["GK", "マシュー・ライアン", "1992-04-08", "レバンテ（スペイン）"],
  ["GK", "ポール・イッツォ", "1995-01-06", "ラナース（デンマーク）"],
  ["GK", "パトリック・ビーチ", "2003-08-06", "メルボルン・シティ"],
  // DF 10
  ["DF", "アジズ・ベヒッチ", "1990-12-16", "メルボルン・シティ"],
  ["DF", "ジェイソン・ゲリア", "1993-05-10", "アルビレックス新潟（日本）"],
  ["DF", "ルーカス・ヘリントン", "2007-07-05", "コロラド・ラピッズ（アメリカ）"],
  ["DF", "カイ・トレウィン", "2001-05-18", "ニューヨーク・シティFC（アメリカ）"],
  ["DF", "ミロシュ・デゲネク", "1994-04-28", "APOELニコシア（キプロス）"],
  ["DF", "ジェイコブ・イタリアーノ", "2001-07-30", "グラーツァーAK（オーストリア）"],
  ["DF", "ジョーダン・ボス", "2002-10-29", "フェイエノールト（オランダ）"],
  ["DF", "キャメロン・バージェス", "1995-10-21", "スウォンジー・シティ（ウェールズ）"],
  ["DF", "ハリー・ソウター", "1998-10-22", "レスター・シティ（イングランド）"],
  ["DF", "アレッサンドロ・チルカティ", "2003-10-10", "パルマ（イタリア）"],
  // MF 6
  ["MF", "ポール・オコン・エングストラー", "2005-01-24", "シドニーFC"],
  ["MF", "エイデン・オニール", "1998-07-04", "ニューヨーク・シティFC（アメリカ）"],
  ["MF", "アイディン・フルスティッチ", "1996-07-05", "ヘラクレス・アルメロ（オランダ）"],
  ["MF", "キャメロン・デヴリン", "1998-06-07", "ハーツ（スコットランド）"],
  ["MF", "コナー・メットカーフ", "1999-11-05", "ザンクト・パウリ（ドイツ）"],
  ["MF", "ジャクソン・アーヴァイン", "1993-03-07", "ザンクト・パウリ（ドイツ）"],
  // FW 7
  ["FW", "ネストリ・イランクンダ", "2006-02-09", "ワトフォード（イングランド）"],
  ["FW", "モハメド・トゥーレ", "2004-03-26", "ノリッジ・シティ（イングランド）"],
  ["FW", "アワー・マビル", "1995-09-15", "カステリョン（スペイン）"],
  ["FW", "クリスチャン・ヴォルパート", "2003-11-15", "サッスオーロ（イタリア）"],
  ["FW", "テテ・イェンギ", "2000-11-28", "町田ゼルビア（日本）"],
  ["FW", "ニシャン・ヴェルピレイ", "2001-05-07", "メルボルン・ビクトリー"],
  ["FW", "マシュー・レッキー", "1991-02-04", "メルボルン・シティ"],
];

const COUNTRIES = [{ teamId: "AUS", idPrefix: "aus", roster: AUS }];

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
