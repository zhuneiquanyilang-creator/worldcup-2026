# 2026 FIFA World CUP ホームページ

2026年 FIFA ワールドカップ（アメリカ・カナダ・メキシコ共催）の情報サイト。
出場48カ国・全104試合の日程／順位表／スタッツ／過去大会を閲覧できる Web アプリです。

🌐 **公開サイト**: https://zhuneiquanyilang-creator.github.io/worldcup-2026/

## 主な機能

- **順位表** — 12グループの勝点・得失点・順位（3位チームの進出ランキング付き）
- **日程・結果** — 全104試合の一覧／トーナメント表。試合カードから詳細（試合経過・フォーメーション）へ
- トーナメント表-R32 から決勝までのブラケット
- コラム-見どころや本サイトの使い方
-レギュレーション-大会の公式ルールまとめ
- **スタッツ** — 得点ランキング・アシストランキング
- **過去の大会** — 1930〜2022年の歴代W杯の結果・各賞・トーナメント表

> ※ データは `public/data/` の JSON。現在は大会開幕前のため、試合は日程のみ（スコアなし）です。

## 技術スタック

- React 18 + TypeScript
- Vite
- React Router v6（ハッシュルーティング）
- CSS Modules

## ローカルで動かす

必要環境: Node.js 20 以上

```bash
npm install
npm run dev
```

開発サーバーが起動し、ブラウザで http://localhost:5173 が開きます。

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド（`dist/` に出力）|
| `npm run preview` | ビルド結果をローカルで確認 |

## デプロイ

`main` ブランチへ push すると、GitHub Actions（`.github/workflows/deploy.yml`）が
自動でビルドして GitHub Pages に公開します。

## ドキュメント

プロジェクトの詳細仕様は [CLAUDE.md](./CLAUDE.md) と [`docs/`](./docs/) にまとめています。

- [docs/architecture.md](./docs/architecture.md) — ディレクトリ構成・ルーティング設計
- [docs/data-model.md](./docs/data-model.md) — 型定義・試合詳細ページ
- [docs/tournament.md](./docs/tournament.md) — 大会公式データ・トーナメント方式・タイブレーカー
- [docs/features.md](./docs/features.md) — 機能実装メモ（ライブ更新・Sofascore・国旗 等）
- [docs/deployment.md](./docs/deployment.md) — GitHub Pages デプロイ・開発の進め方
