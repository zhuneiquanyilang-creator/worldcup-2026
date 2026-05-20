/**
 * `public/data/` 配下の JSON への URL を組み立てる。
 *
 * GitHub Pages などサブパス配信 (例: `https://user.github.io/repo/`) では
 * ルート絶対パス `/data/...` が壊れるため、`import.meta.env.BASE_URL`
 * (ビルド時の `--base`) を前置する。data ファイルの fetch は必ずこれを通す。
 */
export function dataUrl(file: string): string {
  return `${import.meta.env.BASE_URL}data/${file}`;
}
