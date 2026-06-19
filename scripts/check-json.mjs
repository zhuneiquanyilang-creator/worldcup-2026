#!/usr/bin/env node
/**
 * ステージ済み (=`git add` 済み) の `.json` ファイルを `JSON.parse` で検証する。
 * 1 つでも壊れていたら exit 1 で commit を中断。
 *
 * 用途:
 *   1. `.git/hooks/pre-commit` から呼び出して、壊れた match_results.json が
 *      公開サイトに上がる事故を防ぐ。
 *   2. 手動でも `npm run check-json` で同じ検証を走らせられる。
 *
 * 過去事例: 末尾に余分な `}` が混入 (エディタの誤挿入と思われる) →
 * 公開サイトの `JSON.parse` が失敗 → file レイヤー空 → 全試合スコア消滅。
 * dev サーバ側の自動修復 (`runStartupSelfHeal`) は手動 commit の前に
 * 走るとは限らないため、最終防衛線として commit 時に弾く。
 */
import { execSync } from "child_process";
import fs from "fs";

let staged;
try {
  staged = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
  });
} catch {
  // git 未インストール or 最初の commit 以前 → スキップ
  process.exit(0);
}

const files = staged
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter((s) => s.endsWith(".json"));

if (files.length === 0) process.exit(0);

/** 末尾のバランス外文字 ( `\n}` 等) を切り落として再 parse を試みる。
 *  成功すれば修復された Object を返す。失敗 (本質的に壊れている) なら null。 */
function selfHealJson(raw) {
  try {
    return { data: JSON.parse(raw), repaired: false };
  } catch {
    // fall through
  }
  let depth = 0,
    lastClose = -1,
    inStr = false,
    esc = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (inStr) {
      if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') {
      inStr = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) lastClose = i;
    }
  }
  if (lastClose < 0) return null;
  try {
    return { data: JSON.parse(raw.slice(0, lastClose + 1)), repaired: true };
  } catch {
    return null;
  }
}

let errors = 0;
let healed = 0;
for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    console.error(`[check-json] read failed: ${file}: ${e.message}`);
    errors++;
    continue;
  }
  const result = selfHealJson(raw);
  if (!result) {
    console.error(`[check-json] INVALID JSON (修復不能): ${file}`);
    errors++;
    continue;
  }
  if (result.repaired) {
    const fixed = JSON.stringify(result.data, null, 2) + "\n";
    fs.writeFileSync(file, fixed, "utf8");
    try {
      execSync(`git add -- "${file}"`, { stdio: "pipe" });
    } catch (e) {
      console.error(`[check-json] git add failed for ${file}: ${e.message}`);
      errors++;
      continue;
    }
    console.warn(
      `[check-json] 末尾ゴミを自動修復してステージに戻しました: ${file}`
    );
    healed++;
  }
}

if (errors > 0) {
  console.error(
    `\n[check-json] ${errors} 個の修復不能な JSON ファイルがあります。commit を中断しました。`
  );
  console.error(
    `[check-json] 緊急回避: --no-verify を付けると hook を skip できます (推奨しません)。`
  );
  process.exit(1);
}

if (healed > 0) {
  console.warn(
    `[check-json] ${healed} ファイルを自動修復しました。そのまま commit を進めます。`
  );
}
process.exit(0);
