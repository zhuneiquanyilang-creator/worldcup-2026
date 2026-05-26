/**
 * matches.json の venue から都市名を除いて「スタジアム名（国名）」だけにする。
 *   "エスタディオ・アステカ, メキシコシティ（メキシコ）"
 *     → "エスタディオ・アステカ（メキシコ）"
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = join(HERE, "..", "public", "data", "matches.json");

const matches = JSON.parse(await readFile(FILE, "utf8"));

let changed = 0;
for (const m of matches) {
  if (!m.venue || m.venue === "未定") continue;
  // "<stadium>, <city>（<country>）" → "<stadium>（<country>）"
  const next = m.venue.replace(/, [^（]+（/, "（");
  if (next !== m.venue) {
    m.venue = next;
    changed++;
  }
}

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
console.log(`都市名を削除: ${changed} 試合`);
