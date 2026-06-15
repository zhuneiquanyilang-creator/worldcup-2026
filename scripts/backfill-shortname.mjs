#!/usr/bin/env node
// 各チームの players JSON に shortName フィールドを追加する一回限りスクリプト。
//
//   node scripts/backfill-shortname.mjs
//
// ルール:
//  - KOR: フルネームを shortName に入れる (姓先頭・中黒区切りで surnameOf が誤動作するため)
//  - 上記以外: surnameOf(name) の結果を入れる
//    - 中黒 (・) 区切りの場合は最後のトークン (例: フィルジル・ファンダイク → ファンダイク)
//    - 英語名: 最後のスペース以降 (例: Cole Palmer → Palmer)
//    - 漢字 + 空白 + 名前: 最初のトークン (例: 南野 拓実 → 南野)
//    - それ以外: name 全体 (例: 漢字のみ 4 文字「鈴木彩艶」など) → 個別に編集を想定
//  - 既に shortName が入っているエントリは触らない

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const PLAYERS_DIR = "public/data/players";

function surnameOf(name) {
  if (!name) return name;
  if (name.includes("・") || name.includes("·")) {
    const parts = name.split(/[・·]+/);
    return parts[parts.length - 1] || name;
  }
  if (/[぀-ヿ一-鿿]/.test(name) && /[\s　]/.test(name)) {
    return name.split(/[\s　]+/)[0];
  }
  if (/\s/.test(name)) {
    const parts = name.split(/\s+/);
    return parts[parts.length - 1];
  }
  return name;
}

function deriveShortName(p) {
  if (p.teamId === "KOR") return p.name;
  return surnameOf(p.name);
}

async function main() {
  const files = (await readdir(PLAYERS_DIR)).filter((f) => f.endsWith(".json"));
  let touched = 0;
  let skipped = 0;
  for (const f of files) {
    const path = join(PLAYERS_DIR, f);
    const raw = await readFile(path, "utf8");
    const arr = JSON.parse(raw);
    let changed = false;
    for (const p of arr) {
      if (typeof p.shortName === "string" && p.shortName.length > 0) {
        skipped++;
        continue;
      }
      p.shortName = deriveShortName(p);
      changed = true;
      touched++;
    }
    if (changed) {
      await writeFile(path, JSON.stringify(arr, null, 2) + "\n", "utf8");
      console.log(`  ${f}: updated`);
    }
  }
  console.log(`\nDone. touched=${touched}, skipped=${skipped}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
