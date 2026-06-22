/**
 * `public/data/` 配下の JSON への URL を組み立てる。
 *
 * GitHub Pages などサブパス配信 (例: `https://user.github.io/repo/`) では
 * ルート絶対パス `/data/...` が壊れるため、`import.meta.env.BASE_URL`
 * (ビルド時の `--base`) を前置する。data ファイルの fetch は必ずこれを通す。
 *
 * デプロイ単位の cache-buster `?v=<buildVersion>` を付与することで:
 *   - 同一デプロイ内: 全ユーザーが同じ URL → ブラウザ / CDN キャッシュ ヒット
 *   - 新デプロイ後: URL が変わる → 強制再取得 (古い JSON が残り続けない)
 * GitHub Pages の 10 分キャッシュで端末ごとに差が出る問題を解消する。
 */
export function dataUrl(file: string): string {
  const sep = file.includes("?") ? "&" : "?";
  return `${import.meta.env.BASE_URL}data/${file}${sep}v=${__BUILD_VERSION__}`;
}
