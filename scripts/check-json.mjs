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

let errors = 0;
for (const file of files) {
  // 削除されたファイル等は読めないのでスキップ
  if (!fs.existsSync(file)) continue;
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (e) {
    console.error(`[check-json] read failed: ${file}: ${e.message}`);
    errors++;
    continue;
  }
  try {
    JSON.parse(raw);
  } catch (e) {
    console.error(`[check-json] INVALID JSON: ${file}`);
    console.error(`              ${e.message}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(
    `\n[check-json] ${errors} 個の壊れた JSON ファイルがあります。commit を中断しました。`
  );
  console.error(
    `[check-json] ヒント: dev サーバを起動すると match_results.json は runStartupSelfHeal で自動修復されます。`
  );
  console.error(
    `[check-json] 緊急回避: どうしても commit したい場合は --no-verify を付けてください (推奨しません)。`
  );
  process.exit(1);
}

process.exit(0);
