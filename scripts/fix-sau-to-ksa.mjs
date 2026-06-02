/**
 * teamId="SAU" / id="p_sau_*" を正しい FIFA コード "KSA" / "p_ksa_*" にリネーム。
 *
 * 経緯: 2026-06-02 に worldcdb から追加した 26 名を SAU 表記で登録したが、
 *       teams.json は KSA (Kingdom of Saudi Arabia) を使っているためチーム
 *       詳細ページから検出できなかった。
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "players.json");

const players = JSON.parse(await readFile(FILE, "utf8"));
let renamed = 0;
for (const p of players) {
  if (p.teamId === "SAU") {
    p.teamId = "KSA";
    renamed++;
  }
  if (p.id.startsWith("p_sau_")) {
    p.id = p.id.replace("p_sau_", "p_ksa_");
  }
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

console.log(`renamed: ${renamed} entries SAU -> KSA`);
console.log(`KSA count: ${players.filter((x) => x.teamId === "KSA").length}`);
console.log(`SAU count: ${players.filter((x) => x.teamId === "SAU").length}`);
