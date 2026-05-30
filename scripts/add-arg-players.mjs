/**
 * players.json にアルゼンチン代表 26 名を追加する一回限りスクリプト。
 *
 * 出典: worldcdb.com/argentina.htm (2026-05-30 取得)。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "players.json");

const ARG = [
  // GK 3
  ["GK", "エミリアーノ・マルティネス", "1992-09-02", "アストン・ヴィラ（イングランド）"],
  ["GK", "フアン・ムッソ", "1994-05-06", "アトレティコ・マドリード（スペイン）"],
  ["GK", "ヘロニモ・ルジ", "1992-05-20", "オリンピック・マルセイユ（フランス）"],
  // DF 8
  ["DF", "ゴンサロ・モンティエル", "1997-01-01", "リーベル・プレート"],
  ["DF", "ニコラス・オタメンディ", "1988-02-12", "ベンフィカ（ポルトガル）"],
  ["DF", "ファクンド・メディーナ", "1999-05-28", "オリンピック・マルセイユ（フランス）"],
  ["DF", "レオナルド・バレルディ", "1999-01-26", "オリンピック・マルセイユ（フランス）"],
  ["DF", "ニコラス・タグリアフィコ", "1992-08-31", "オリンピック・リヨン（フランス）"],
  ["DF", "クリスティアン・ロメロ", "1998-04-27", "トッテナム・ホットスパー（イングランド）"],
  ["DF", "リサンドロ・マルティネス", "1998-01-18", "マンチェスター・ユナイテッド（イングランド）"],
  ["DF", "ナウエル・モリーナ", "1998-04-06", "アトレティコ・マドリード（スペイン）"],
  // MF 7
  ["MF", "レアンドロ・パレデス", "1994-06-29", "ボカ・ジュニアーズ"],
  ["MF", "ロドリゴ・デ・パウル", "1994-05-24", "インテル・マイアミ（アメリカ）"],
  ["MF", "バレンティン・バルコ", "2004-07-23", "ストラスブール（フランス）"],
  ["MF", "エセキエル・パラシオス", "1998-10-05", "バイヤー・レバークーゼン（ドイツ）"],
  ["MF", "ジオバニ・ロ・チェルソ", "1996-04-09", "ベティス（スペイン）"],
  ["MF", "エンソ・フェルナンデス", "2001-01-17", "チェルシー（イングランド）"],
  ["MF", "アレクシス・マク・アリステル", "1998-12-24", "リバプール（イングランド）"],
  // FW 8
  ["FW", "リオネル・メッシ", "1987-06-24", "インテル・マイアミ（アメリカ）"],
  ["FW", "フリアン・アルバレス", "2000-01-31", "アトレティコ・マドリード（スペイン）"],
  ["FW", "ニコラス・ゴンサレス", "1998-04-06", "アトレティコ・マドリード（スペイン）"],
  ["FW", "ジュリアーノ・シメオネ", "2002-12-18", "アトレティコ・マドリード（スペイン）"],
  ["FW", "ティアゴ・アルマーダ", "2001-04-26", "アトレティコ・マドリード（スペイン）"],
  ["FW", "ラウタロ・マルティネス", "1997-08-22", "インテル（イタリア）"],
  ["FW", "ニコラス・パス", "2004-09-08", "コモ（イタリア）"],
  ["FW", "ホセ・マヌエル・ロペス", "2000-12-06", "パルメイラス（ブラジル）"],
];

const COUNTRIES = [{ teamId: "ARG", idPrefix: "arg", roster: ARG }];

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
