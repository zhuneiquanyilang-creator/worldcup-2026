/**
 * matches.json を元の「1試合1行・キーの後に空白」スタイルに再整形する一回限りスクリプト。
 *   出力例: { "id": "m001", "stage": "group", ... }
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "matches.json");

const matches = JSON.parse(await readFile(FILE, "utf8"));

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
console.log(`reformatted ${matches.length} matches`);
