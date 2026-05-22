# デプロイと開発の進め方

このファイルは [CLAUDE.md](../CLAUDE.md) から読み込まれる詳細ドキュメント。

## デプロイ (GitHub Pages)

PCの電源・回線に関係なくスマホからアクセスできるよう、GitHub Pages で公開する構成。

- **base パス**: ビルド時に `--base=/<repo>/` で注入。`.github/workflows/deploy.yml` が `github.event.repository.name` から自動設定するため、リポジトリ名を変えても編集不要。ローカル `npm run dev` は `base=/` のまま動く。
- **ルーティング**: `createHashRouter`（URL に `#` が入る）。GitHub Pages は SPA の直リンク／リロードで 404 になるため、ハッシュルーティングで回避。
- **データ取得**: `public/data/` の JSON は `utils/dataUrl.ts` の `dataUrl()` 経由で `import.meta.env.BASE_URL` を前置（サブパス配信対応）。**data ファイルの fetch は必ず `dataUrl()` を使うこと。**
- **CI/CD**: `.github/workflows/deploy.yml` が main への push で自動ビルド＆デプロイ。
- **制約**: Sofascore ライブ取得は dev サーバーのプロキシ依存のため GitHub Pages では動かない（CORS）。ライブ更新は graceful に失敗するだけ。国旗 (flagcdn) は閲覧端末のネット接続で表示される。

## 開発の進め方

1. **CLAUDE.md（本ファイル）** ← 完了
2. プロジェクト初期化（Vite + React + TS）
3. 共通レイアウト + ナビゲーション + ルーティング
4. ダミーJSONデータ整備
5. メニュー実装の順番:
   1. 順位表
   2. 日程
   3. 試合結果・詳細
   4. スタッツ
6. スタイル調整
