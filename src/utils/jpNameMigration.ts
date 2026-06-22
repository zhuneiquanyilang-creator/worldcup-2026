/**
 * 一回限りの localStorage 移行: JPN 選手名を「苗字 名前」(半角スペース区切り)
 * に統一する。
 *
 * 背景: JPN.json と public/data/match_results.json は事前に空白入り表記へ
 * 更新済みだが、ユーザーの localStorage (matchEdits / matchOverrides) は
 * 旧表記「鈴木彩艶」のまま。これが残っていると useAutoSyncResults が
 * 毎回 match_results.json を旧表記で上書きしてしまう。
 *
 * 実行方式: localStorage の JSON 文字列に対して、ダブルクォート込みの
 * `"鈴木彩艶"` を `"鈴木 彩艶"` に置換する単純な文字列置換。値だけマッチ
 * (キーには JPN 選手名は現れない)。冪等性: 既に置換済みなら no-op。
 *
 * フラグ `wc2026:jpNameMigrationV1` を立てて 2 回目以降は skip。
 * 必要なら削除して再実行可。
 */

const FLAG_KEY = "wc2026:jpNameMigrationV1";
const TARGET_KEYS = ["wc2026:matchEdits", "wc2026:matchOverrides"];

const NAME_MAP: Record<string, string> = {
  鈴木彩艶: "鈴木 彩艶",
  菅原由勢: "菅原 由勢",
  谷口彰悟: "谷口 彰悟",
  板倉滉: "板倉 滉",
  長友佑都: "長友 佑都",
  町野修斗: "町野 修斗",
  田中碧: "田中 碧",
  久保建英: "久保 建英",
  後藤啓介: "後藤 啓介",
  堂安律: "堂安 律",
  前田大然: "前田 大然",
  大迫敬介: "大迫 敬介",
  中村敬斗: "中村 敬斗",
  伊東純也: "伊東 純也",
  鎌田大地: "鎌田 大地",
  渡辺剛: "渡辺 剛",
  鈴木唯人: "鈴木 唯人",
  上田綺世: "上田 綺世",
  小川航基: "小川 航基",
  瀬古歩夢: "瀬古 歩夢",
  伊藤洋輝: "伊藤 洋輝",
  冨安健洋: "冨安 健洋",
  早川友基: "早川 友基",
  佐野海舟: "佐野 海舟",
  鈴木淳之介: "鈴木 淳之介",
  塩貝健斗: "塩貝 健斗",
};

export function runJpNameMigration() {
  if (typeof window === "undefined" || !window.localStorage) return;
  if (localStorage.getItem(FLAG_KEY)) return;

  for (const key of TARGET_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    let text = raw;
    let changed = false;
    for (const [old, neo] of Object.entries(NAME_MAP)) {
      const needle = `"${old}"`;
      if (text.includes(needle)) {
        text = text.split(needle).join(`"${neo}"`);
        changed = true;
      }
    }
    if (changed) {
      try {
        localStorage.setItem(key, text);
        console.log(
          `[jpNameMigration] ${key}: 旧 JPN 選手名表記をスペース入り表記に更新しました`
        );
      } catch {
        /* quota 等は無視 */
      }
    }
  }

  try {
    localStorage.setItem(FLAG_KEY, "1");
  } catch {
    /* 無視 */
  }
}
