/// <reference types="vite/client" />

/** ビルド時に vite.config.ts の `define` で埋め込まれる
 *  デプロイ単位のバージョン文字列 (例 "lz3a4b5c")。
 *  data ファイル fetch の cache-buster (?v=...) として使用し、
 *  ブラウザ / CDN キャッシュをデプロイのたびに強制的に取り直させる。 */
declare const __BUILD_VERSION__: string;
