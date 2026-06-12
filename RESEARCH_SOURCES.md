# 情報収集ソース許可リスト

このファイルはユーザー（プロジェクトオーナー）が編集します。Claudeはここに記載された URL／ドメイン以外への WebFetch / WebSearch を行いません。

## ルール

- **デフォルトは「禁止」**: 下のリストに記載がない URL は Claude が自発的にアクセスしません。
- **会話内で直接送られた URL は OK**: ユーザーがチャットに貼り付けた URL は、その会話内に限り使用可（恒久的に許可したい場合はこのファイルに追記）。
- **WebSearch（汎用検索）は原則禁止**。リサーチが必要な場合は Claude から「この用途で検索したいですが許可しますか？」とユーザーに確認する。
- **記載形式**: 1行1エントリ。URL でもドメインでもよい。`#` から行末まではコメント。

---

## 許可ドメイン / URL

https://www.fifa.com/ja/tournaments/mens/worldcup/canadamexicousa2026/  # FIFA公式 2026ワールドカップ（日本語）。配下のページも可。※注: SPAのためWebFetchは空が返る。
https://ja.wikipedia.org/wiki/                                          # 日本語Wikipedia（2026 FIFA W杯ページとその配下記事）
https://en.wikipedia.org/wiki/                                          # 英語Wikipedia（同上）
https://worldcdb.com/                                                   # World Cup Database — 各国代表ニュース・統計 (起点: nationalnews.htm)
https://inside.fifa.com/fifa-world-ranking/                             # FIFA公式 世界ランキング (men/women)
https://mikami3345.cloudfree.jp/GroupLeague/WorldCupHistry/             # W杯出場国別 歴代成績
https://www.sofascore.com/                                              # Sofascore — ライブスコア・試合経過 (W杯本番のライブ情報源)
https://api.sofascore.com/                                              # Sofascore 内部 JSON API (CORS制限あり、要プロキシ)
https://v3.football.api-sports.io/                                      # API-Football v3 (ライブスコア・フォーメーション・イベント、無料枠100/日)
https://dashboard.api-football.com/                                     # API-Football ダッシュボード (使用量確認・API キー管理)
https://api.football-data.org/                                          # Football-Data.org v4 (W杯ライブスコア・順位・得点者、無料枠10req/分)
https://www.football-data.org/                                          # Football-Data.org ダッシュボード (API キー管理)

---

## 許可された検索クエリ（WebSearch を使う場合のみ）

<!-- 例:
"2026 FIFA World Cup groups"
-->

(まだ何も登録されていません)
