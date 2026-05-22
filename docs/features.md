# 機能実装メモ

このファイルは [CLAUDE.md](../CLAUDE.md) から読み込まれる詳細ドキュメント。

## ライブ更新の枠組み

試合開始時刻〜終了枠 (グループ135分 / KO180分) の試合を「ライブ中」と判定し、外部ソースから 1 分毎にデータを取得して localStorage に上書き保存する仕組み。サイト未決定のため現在は Mock 実装。

| 役割 | ファイル |
|------|---------|
| 試合タイミング判定 | `utils/matchTiming.ts` (`isLive`) |
| 部分更新型 | `types/live.ts` (`LiveUpdate`) |
| 永続化 | `utils/matchOverrides.ts` (localStorage) |
| ソース抽象化 | `services/liveSource.ts` (`LiveSource` interface + `MockLiveSource`) |
| ポーリング | `hooks/useLivePolling.ts` (1分毎、ライブ中のみフェッチ) |
| データ統合 | `hooks/useMatches.ts` が file + localStorage をマージ |
| 表示 | `components/common/LiveBadge.tsx` (赤いパルスバッジ) |

ポーリングは `<Layout>` 配下にマウント。アプリ全体で1インスタンス。ライブ中試合 0 ならネットワーク呼び出しゼロ。

## Sofascore 連携

ライブ情報源として **Sofascore** を採用。`services/sofascoreSource.ts` の `SofascoreLiveSource` が以下を実装:

| エンドポイント | 用途 |
|---|---|
| `/event/{id}` | ステータス・スコア・isLive |
| `/event/{id}/incidents` | ゴール・カード・交代 |

**CORS 対策**: `vite.config.ts` で `/sofascore-api/*` → `https://api.sofascore.com/api/v1/*` のリバースプロキシを設定（dev server のみ有効）。本番デプロイ時は別途リバースプロキシが必要。

**試合ID マッピング**: `public/data/sofascore_mapping.json` にローカル試合ID (`m001` 等) と Sofascore event ID (`15186710` 等) の対応を保存。トーナメントID: `16`、シーズン: `58210` (2026)。全104試合 + `test_che_tot`（テスト用）を登録済み（`scripts/build-mapping.mjs` で生成）。未登録試合があればライブ更新はスキップ (graceful)。

**インシデント変換**:
- `incidentType="goal"` → `Goal` (`incidentClass`: regular/penalty/ownGoal → normal/penalty/own)
- `incidentType="card"` → `Booking` (`incidentClass`: yellow/red/yellowRed → Y/R/Y2R)
- `incidentType="substitution"` → `Substitution`
- `isHome` フラグで teamId 判定

**選手マッチング戦略**: 名前 (英語) ↔ players.json (日本語) の翻訳問題を避けるため、**背番号 (`Player.number`) で突合**する方針。`Player` 型に `number?: number` を追加済み。実装は背番号データが入った段階で:
1. SofascoreLiveSource で /lineups から `shirtNumber` を取得
2. インシデントの player.name を lineup でマップ → shirtNumber
3. `players.json` を `(teamId + number)` でルックアップ → `playerId`
4. `computePlayerStats` の集計ロジックは playerId ベースのまま動く

**マッピングの生成・更新**: `scripts/build-mapping.mjs` が Sofascore の大会日程（`/unique-tournament/16/season/58210/events/next/{0..}`）を取得し、グループ戦は出場2チームの組、決勝トーナメントは進出条件ラベル（「73試合勝者」「A組2位」等）で `matches.json` と照合して `sofascore_mapping.json` を再生成する。dev サーバー起動中に `node scripts/build-mapping.mjs` で実行（取得は dev プロキシ経由。Node から直接 api.sofascore.com を叩くと 403 になるため）。Sofascore 側の event ID が変わった場合も再実行で更新できる。

## 順位表・スタッツの自動導出

| 表示 | 計算ロジック | 入力データ |
|------|-------------|-----------|
| 順位表 (`/standings`) | `utils/computeStandings.ts` | `teams.json` + `matches.json` の `stage="group" && status="finished"` |
| スタッツ得点・アシスト (`/stats`) | `utils/computePlayerStats.ts` | `players.json` + `matches.json` の `status="finished"` |

得点者・アシストの紐付けルール: `Goal.playerId` (players.json 参照) があればそれを使い、なければ `Goal.playerName` を `players.json` の `name` と完全一致で検索。どちらも該当しなければチーム側の集計のみで個人は計上されない。自殺点 (`type="own"`) は得点者にカウントしない。
- `team_details.json`: 48カ国分のチーム史データ（大陸・**世界ランク**・監督（氏名・国籍）・出場回数・初出場・前回出場・最高成績）。出典 Wikipedia（各国代表記事のインフォボックス、2026-05-18 取得、世界ランクは 2026/4/1 時点）。FIFA公式と worldcdb.com には監督・ランキング情報がないため Wikipedia から取得。

## 年齢計算

`utils/age.ts` の `calculateAge(birthDate)` が「2026-06-11 開幕日時点」での満年齢を返す。観覧時刻に依存しない安定値。`PlayerRoster` 表示用。

## TBD 試合の表示

`Match` 型に `homeTeamLabel` / `awayTeamLabel`（optional）を追加。`homeTeamId` が `teams.json` に存在しない場合は label を表示する。`MatchCard` / `MatchResultCard` / `ScoreBoard` がこのフォールバックを実装。`utils/team.ts` の `teamDisplay()` がヘルパ。

## チーム詳細ページ

`/teams/:id`（`TeamDetailPage`）。順位表のチーム名、試合カードのチーム名、試合詳細のチーム名すべてからリンク。ヘッダ（国旗・国名）の下に**タブ切替**（「チーム詳細」/「選手一覧」、`useState` でローカル管理）を置き、内容を出し分ける:

- **チーム詳細タブ**: `TeamProfile`（大陸 / 最高成績 / 出場回数 / 初出場 / 前回出場）＋ `TeamHistory`（過去の年別成績）
- **選手一覧タブ**: `PlayerRoster`（選手一覧）

データソース: `public/data/team_details.json`（48チーム分）。出典は Wikipedia 英語版「National team appearances in the FIFA World Cup」（2026-05-18 取得）。

## 国名検索（ヘッダー）

ヘッダー (`components/common/Header.tsx`) に国名検索ボックス `components/common/TeamSearch.tsx` を配置。`<Layout>` 経由で全ページ共通に表示される。

- 入力をチーム名（日本語）・英語名 (`nameEn`)・FIFAコード (`id`) に部分一致でフィルタ（`teams.json` を `useTeams` で取得）。
- 候補は最大8件。各候補に国旗・国名・英語名・所属グループを表示。
- 候補をクリック／Enter で `/teams/:id`（`TeamDetailPage`）へ遷移。
- キーボード操作: ↑↓ で候補移動、Enter で決定、Esc で閉じる。ボックス外クリックでも閉じる。

## 国旗の表示

Windows 等で Unicode 国旗絵文字が正しく描画されないため、`components/common/Flag.tsx` が flagcdn.com の SVG を `<img>` で表示する。`Team.isoCode` (ISO 3166-1 alpha-2、英国構成国は `gb-eng` / `gb-sct`) を URL に使用。表示箇所:

- 順位表 (`StandingsRow`)
- 日程・結果カード (`TeamLink` 経由で MatchCard / BracketMatch)
- 試合詳細スコアボード (`ScoreBoard`)
- チーム詳細ヘッダ (`TeamDetailPage`)

外部ホスト依存だが、研究用途ではなくランタイム画像として `<img>` で取得するため許可リスト管理対象外。

## チーム名のクリック対応

`components/common/TeamLink.tsx` がチームが `teams.json` に存在すれば `/teams/:id` へのリンクを返し、TBD ラベル（例「A組1位」）の場合はリンクなし span を返す。

試合カード（MatchCard / BracketMatch）は外側を `<Link>` から `<div role="link" onClick + onKeyDown>` に変更。内側のチーム名は `TeamLink` で個別リンク、`stopPropagation` で親の navigate を抑止。

## トーナメント表ビュー

`components/schedule/BracketView.tsx` が**左右対称ブラケット**を表示:

```
[左R32]→[左R16]→[左QF]→[左SF]  [決勝+3位決定戦]  [右SF]←[右QF]←[右R16]←[右R32]
```

- 左半分は SF 101 に集約する側、右半分は SF 102 に集約する側
- ブラケット配列 (`LEFT_R32` / `RIGHT_R32` など) はハードコード。並び順は次ラウンドのペアリング順
- 中央列は決勝カード + 3位決定戦（下に小さく）
- 各セルは `BracketMatch.tsx` のコンパクトカード
- 横スクロール対応

## 試合番号の表示

R32 以降の TBD ラベル（例「73試合勝者」）が指す試合を見分けられるよう、各試合カード／詳細に FIFA の試合番号（1〜104）を表示する。`utils/matchNumber.ts` の `matchNumber()` が `m073` → 73 のように ID からパース。表示位置:

- `MatchCard`（日程）: 左上にバッジ「#73」
- `MatchResultCard`（試合結果一覧）: 左上にバッジ「#73」
- `ScoreBoard`（試合詳細）: メタ行に金バッジ「第73試合」
- `players.json`: 既存の主要選手リスト（イタリア除く）。全選手 `goals: 0, assists: 0`。

UI 側の対応:
- 順位表: `played=0` のときは「上位2チーム進出」マーカーを非表示にし、凡例を「未開催（順位は仮表示）」に切替。
- スタッツ: 得点・アシストとも 0 の場合は「まだ得点はありません / まだアシストはありません」を表示。

## 過去の大会ページ

`/past`（`PastTournamentsPage`）が 1930〜2022 年の歴代W杯を**新しい順**に一覧表示。出典は `public/data/world_cup_hosts.json`（year ≤ 2022 でフィルタ）。各行クリックで `/past/:year`（`PastTournamentDetailPage`）へ。

詳細ページの表示項目（`public/data/world_cup_results.json`、1大会1エントリ）:

- **結果**: 1位／2位／3位／4位（国名）
- **個人賞**: ゴールデンボール（最優秀選手）／シルバーボール／ブロンズボール／ゴールデンブーツ（得点王）／ゴールデングローブ（最優秀GK）／ベストヤングプレーヤー（最優秀若手選手）／ベストゴール

各賞は `{ player, nationality }`（選手名＋国籍、いずれも手入力テキスト）。`world_cup_results.json` は 1930〜2022 の22大会分。結果（1〜4位）と一部の賞は worldcdb.com の各大会ページ（2026-05-20 取得）から入力済み。古い大会はゴールデンボール・GK賞・ベストゴール等が未制定/未掲載のため空欄。1930年の3・4位も出典に記載がなく空欄。データ追記はファイルを直接編集する運用。型は `src/types/worldCupResult.ts`。

詳細ページ下部には**トーナメント表**も表示。データは `public/data/world_cup_knockouts.json`（`{ year, matches: KnockoutMatch[] }`）。`KnockoutMatch` は `round`(round16/quarter/semi/third/final) / `team1` / `score1` / `team2` / `score2` / `winner`(1|2) / `note`(延長・PK・再試合)。出典は worldcdb.com の各大会決勝トーナメントページ（`{NN}{country}final.htm`、2026-05-20 取得）。ノックアウト方式のある19大会を収録（決勝リーグ総当たり方式の 1950・1974・1978 は対象外）。表示は `components/past/PastBracket.tsx` がラウンドごとの列でブラケット風に描画、3位決定戦は別枠。勝者を太字＋濃色で強調。
