// 選手データを per-team JSON (public/data/players/{teamId}.json) から読む。
// 旧: public/data/players.json (monolithic) を直接 require していたが、
// per-team 分割後はこのヘルパを使う。

import fs from "fs";
import path from "path";

export const PLAYERS_DIR = path.resolve("public/data/players");

/** 1 か国分の選手を背番号順で返す。 */
export function loadTeamPlayers(teamId) {
  const file = path.join(PLAYERS_DIR, `${teamId}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** 全 48 か国の選手を 1 つの配列にまとめて返す (旧 players.json と同じ形)。 */
export function loadAllPlayers() {
  if (!fs.existsSync(PLAYERS_DIR)) return [];
  const files = fs.readdirSync(PLAYERS_DIR).filter((f) => f.endsWith(".json"));
  return files.flatMap((f) =>
    JSON.parse(fs.readFileSync(path.join(PLAYERS_DIR, f), "utf8"))
  );
}

/** 1 か国分を書き戻す (背番号順ソート + 改行付き)。 */
export function saveTeamPlayers(teamId, players) {
  if (!fs.existsSync(PLAYERS_DIR)) fs.mkdirSync(PLAYERS_DIR, { recursive: true });
  const sorted = [...players].sort(
    (a, b) => (a.number ?? 999) - (b.number ?? 999)
  );
  const file = path.join(PLAYERS_DIR, `${teamId}.json`);
  fs.writeFileSync(file, JSON.stringify(sorted, null, 2) + "\n", "utf8");
}
