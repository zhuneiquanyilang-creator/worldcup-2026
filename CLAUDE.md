# 2026 FIFA World Cup ホームページ

## プロジェクト概要

2026年FIFAワールドカップ（米国・カナダ・メキシコ共催）の情報サイト。
ファン向けに大会の最新情報を一覧できるWebアプリケーション。

## 機能要件（メニュー）

| # | メニュー | 内容 |
|---|---------|------|
| 1 | **順位表** (Standings) | グループステージの各グループの勝点・得失点・順位を表示 |
| 2 | **日程・結果** (Schedule) | 「一覧」「トーナメント表」の2ビュー切替。一覧はステージ・ステータスでフィルタ可。カードクリックで詳細 |
| 3 | **スタッツ** (Stats) | 大会全体の個人記録（得点ランキング、アシストランキング） |
| 4 | **過去の大会** (Past) | 1930〜2022年の歴代W杯一覧（新しい順）。クリックで結果・各賞の詳細 |

※ 元は「日程」と「試合結果」を分けていたが、機能重複のため `/schedule` に統合。`/matches` は `/schedule` へリダイレクト。試合詳細は引き続き `/matches/:id`。

## 技術スタック

- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite
- **ルーティング**: React Router v6
- **スタイリング**: CSS Modules（コンポーネント単位でスコープ化）
- **データ**: `public/data/` 配下の静的JSONファイル（ダミーデータ）
  - 将来的にAPI差し替えできるよう、データ取得層は hooks に集約

## ディレクトリ構成

```
new_claude_app/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── public/
│   └── data/
│       ├── teams.json         # 出場チーム一覧
│       ├── groups.json        # グループ分け
│       ├── standings.json     # 順位表
│       ├── matches.json       # 試合（日程＋結果）
│       └── players.json       # 選手＋個人スタッツ
└── src/
    ├── main.tsx               # エントリポイント
    ├── App.tsx                # アプリ全体のレイアウト
    ├── router.tsx             # ルーティング定義
    ├── types/                 # 型定義（メニューごとに1ファイル）
    │   ├── team.ts
    │   ├── match.ts
    │   ├── standing.ts
    │   └── player.ts
    ├── hooks/                 # データ取得フック
    │   ├── useStandings.ts
    │   ├── useMatches.ts
    │   ├── useSchedule.ts
    │   └── usePlayerStats.ts
    ├── components/
    │   ├── common/            # 全ページ共通
    │   │   ├── Header.tsx
    │   │   ├── Navigation.tsx
    │   │   ├── Footer.tsx
    │   │   └── Layout.tsx
    │   ├── standings/         # 順位表用
    │   │   ├── StandingsTable.tsx
    │   │   ├── StandingsRow.tsx
    │   │   └── GroupTabs.tsx
    │   ├── schedule/          # 日程用
    │   │   ├── ScheduleList.tsx
    │   │   ├── ScheduleDayGroup.tsx
    │   │   └── MatchCard.tsx
    │   ├── matches/           # 試合詳細用
    │   │   ├── MatchList.tsx
    │   │   ├── MatchResultCard.tsx
    │   │   ├── MatchDetail.tsx
    │   │   ├── ScoreBoard.tsx
    │   │   ├── GoalList.tsx
    │   │   └── LineUp.tsx
    │   └── stats/             # スタッツ用
    │       ├── TopScorers.tsx
    │       ├── TopAssists.tsx
    │       └── PlayerStatRow.tsx
    ├── pages/                 # ルートに対応するページ
    │   ├── HomePage.tsx
    │   ├── StandingsPage.tsx
    │   ├── SchedulePage.tsx
    │   ├── MatchesPage.tsx
    │   ├── MatchDetailPage.tsx
    │   └── StatsPage.tsx
    └── styles/
        ├── global.css
        └── variables.css
```

## ルーティング設計

| パス | ページ | コンポーネント |
|------|--------|---------------|
| `/` | トップ（メニュー導線） | `HomePage` |
| `/standings` | 順位表 | `StandingsPage` |
| `/schedule` | 日程・結果 | `SchedulePage` |
| `/matches` | → `/schedule` リダイレクト | (`<Navigate>`) |
| `/matches/:id` | 試合詳細 | `MatchDetailPage` |
| `/teams/:id` | チーム詳細 | `TeamDetailPage` |
| `/stats` | スタッツ（得点・アシスト） | `StatsPage` |
| `/past` | 過去の大会一覧 | `PastTournamentsPage` |
| `/past/:year` | 過去の大会詳細 | `PastTournamentDetailPage` |

## データモデル（型定義の概略）

### Team
```ts
type Team = {
  id: string;          // "JPN" (FIFA 3文字コード)
  name: string;        // "日本"
  nameEn: string;      // "Japan"
  flag: string;        // Unicode 国旗絵文字 (フォールバック)
  isoCode: string;     // "jp" (ISO 3166-1 alpha-2 / 英国構成国は "gb-eng" 等)
  groupId: string;     // "A".."L"（12グループ × 4チーム = 48）
};
```

### Standing
```ts
type Standing = {
  teamId: string;
  played: number;      // 試合数
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};
```

### Match
```ts
type Match = {
  id: string;
  stage: "group" | "round32" | "round16" | "quarter" | "semi" | "third" | "final";
  groupId?: string;
  date: string;          // ISO 8601
  venue: string;         // 会場名
  homeTeamId: string;
  awayTeamId: string;
  homeTeamLabel?: string;  // TBD カード用
  awayTeamLabel?: string;
  status: "scheduled" | "live" | "finished";
  score?: { home: number; away: number };
  goals?: Goal[];
  bookings?: Booking[];          // カード
  substitutions?: Substitution[]; // 交代
  homeFormation?: FormationData;  // フォーメーション
  awayFormation?: FormationData;
  lineup?: { home: string[]; away: string[] }; // 旧フォーマット (未使用)
};

type Goal = {
  minute: number;
  teamId: string;
  playerId?: string;     // players.json 参照
  playerName?: string;   // playerId が無い場合のフォールバック
  assistPlayerId?: string;
  assistPlayerName?: string;
  type: "normal" | "penalty" | "own";
};

type Booking = {
  minute: number;
  teamId: string;
  playerName: string;
  type: "Y" | "Y2R" | "R" | "YR";  // イエロー / 2枚目イエロー / 一発レッド / イエロー後の一発レッド
};

type Substitution = {
  minute: number;
  teamId: string;
  inName: string;
  outName: string;
};

type FormationSpot = {
  x: number;   // 0-100 守備→攻撃方向
  y: number;   // 0-100 左→右
  number?: number;
  name: string;
  role?: string;
};

type FormationData = {
  shape: string;          // "4-3-3" 等
  starting: FormationSpot[];  // 11人
  bench?: { number?: number; name: string }[];
};
```

### 試合詳細ページ (`/matches/:id`)

`MatchDetail` 配下で以下のレイアウト:
- **上部**: `ScoreBoard` (常時表示) — 試合番号 / ステージ / 日時 / 会場 / スコア / 国旗
- **タブ切替**:
  - **試合経過** (default): `MatchEvents` — 得点・カード・交代を分単位で時系列表示。home は右側、away は左側（中央に分単位）
  - **フォーメーション**: `CombinedFormation` — 1枚の SVG ピッチに両チーム11人を配置。**PC は横向き**（ホーム左／アウェイ右）、**スマホ (≤640px) は縦向き**（ホーム上／アウェイ下）に自動切替（`useIsNarrow` が `matchMedia` を監視）。ベンチは下部に常時全表示。
- フォーメーションデータがない試合はタブが disabled

`MatchEvents` は `Goal` / `Booking` / `Substitution` を統合してソート表示。アイコン: ⚽ / 🟨 / 🟥 / 🔁。

### Player
```ts
type Player = {
  id: string;
  name: string;
  teamId: string;
  position: "GK" | "DF" | "MF" | "FW";
  goals: number;
  assists: number;
  birthDate?: string;  // ISO 8601 (YYYY-MM-DD)
  club?: string;       // 所属クラブ
};
```

## 設計方針

- **1ファイル1責務**: 1コンポーネント = 1ファイル。100行を超えたら分割を検討
- **メニュー単位でフォルダを切る**: `components/standings/`, `components/schedule/` のように機能で分離
- **データ取得は hooks に閉じ込める**: ページやコンポーネントから直接 `fetch` しない
- **共通UIは `components/common/`**: ナビゲーション、レイアウト等
- **スタイル**: コンポーネントと同階層に `*.module.css` を配置
- **多言語**: まず日本語UI。将来的に英語対応する場合は `locales/` を切る
- **レスポンシブ**: スマホ用の別画面は作らず、単一コードベースで CSS メディアクエリ対応。ブレークポイントは `@media (max-width: 640px)` に統一。各コンポーネントの `*.module.css` 末尾にモバイル用ブロックを追記する方式。横に長い表 (`StandingsTable` / `StatsTable` / `ThirdPlaceRanking`)・トーナメント表 (`BracketView` / `PastBracket`) はラッパに `overflow-x: auto` を付けて横スクロール対応。

## W杯歴代開催国データ

`public/data/world_cup_hosts.json` に第1回 (1930ウルグアイ) 〜 第25回 (2034サウジアラビア) の開催年・開催国を保存。出典: worldcdb.com/AWC2.htm (2026-05-19 取得)。複数開催国は配列。将来的に「チームが過去にホスト国だった年」をチーム詳細に表示するなど横断利用可。

注: ソースでは2034を「第24回」と記載されていたが、2030が24回・2034は25回なので JSON では修正済み。

## 大会データの前提（公式情報）

出典: Wikipedia「2026 FIFAワールドカップ」（2026-05-17 取得）

- **開催期間**: 2026年6月11日 〜 7月19日
- **開催国**: カナダ・メキシコ・アメリカ合衆国（3か国共催）
- **出場国**: 48カ国
- **グループ**: 12グループ（A〜L）× 4チーム
- **試合数**: 計104試合
- **会場**: 16都市（カナダ2 / 米国11 / メキシコ3）
- **開幕戦**: 2026年6月11日、Estadio Azteca（メキシコシティ）
- **決勝戦**: 2026年7月19日、MetLife Stadium 系（NY/NJ）
- **組合せ抽選**: 2025年12月5日、ワシントンD.C.

### トーナメント方式

グループステージ → ノックアウト。ノックアウトには **ラウンド32** がある（従来のW杯にはない新方式）:

```
グループ (12組×4) → R32 (32チーム) → R16 → QF → SF → 3位決定戦 / 決勝
```

R32 進出条件: 各グループ上位2チーム（24） + 3位成績上位8チーム = 32。

順位表ページ (`/standings`) には各グループの `StandingsTable` の下に `ThirdPlaceRanking` を表示。全12グループの3位チームを横断的にタイブレーカー順で並べ、上位8チームに進出マーカー（緑バー）を付与。

### グループステージ順位決定方法（公式タイブレーカー）

出典: ユーザー提供（FIFA公式ルール準拠、Wikipedia「2026 FIFAワールドカップ」#順位決定方法）

基本: 勝利=3点 / 引分=1点 / 敗北=0点 の合計勝ち点で順位。同点の場合は以下の順で適用:

1. **当該チーム間の対戦における勝ち点** (head-to-head points)
2. **当該チーム間の対戦における得失点差** (head-to-head GD)
3. **当該チーム間の対戦における得点** (head-to-head goals for)

1〜3 適用後もまだ同順位のチームが残る場合、**そのチーム同士で再度 1〜3 を再帰的に適用**。それでも決まらなければ 5 以降:

5. **全試合での得失点差** (overall GD)
6. **全試合での得点** (overall goals for)
7. **フェアプレーポイント**（選手・チーム役員のカードを集計）:
   - イエローカード: **−1**
   - イエローカード 2 枚による退場: **−3**
   - 一発レッド: **−4**
   - イエロー後の一発レッド: **−5**
8. **最新の FIFA ランキング**
9. **過去の FIFA ランキング**（新しい方から順に決まるまで遡る）

### 実装メモ（タイブレーカー）

現在 `components/standings/StandingsTable.tsx` の `compare()` は **簡易版**:

```ts
points → goalDiff → goalsFor
```

これは項目 1（全試合の勝ち点） → 5 → 6 のみで、head-to-head（2〜4）、フェアプレー（7）、FIFA ランク（8〜9）に未対応。

**実装計画**: 大会開幕後（matches に status="finished" が現れたら）、以下を実装する:
- `utils/tiebreaker.ts` に上記順序の compare 関数を作る
- 引数として「対象 standings 配列」「全 matches」「全 players（カード情報含む）」「team_details（FIFA ランク）」を取る
- head-to-head は対象チーム同士の対戦だけを抽出して再帰
- 現状 `matches.json` の goals/lineup/cards は空なので、各試合終了時にこれらを埋める運用が必要

### 型定義への影響

`MatchStage` に `"round32"` を追加すること（現状未対応）。
順序: `group` → `round32` → `round16` → `quarter` → `semi` → `third` → `final`

### ダミーデータの現状

**現状はすべて「大会開幕前」状態で一貫している**:

- `teams.json` / `groups.json`: 12グループ・48チーム（2025-12-05 抽選結果に準拠、Wikipedia ja 出典）。
- `standings.json`: **廃止**。順位表は `utils/computeStandings.ts` が `matches.json` の `status: "finished"` グループ戦から実行時に導出。試合データを更新するだけで順位表に反映される。
- `matches.json`: **全104試合**の実日程（グループ72 + R32 16 + R16 8 + QF 4 + SF 2 + 3位決定戦 1 + 決勝 1）。すべて `status: "scheduled"`、スコアなし。出典は Wikipedia（2026-05-18 取得）。
  - **R32**: 日付・会場確定、対戦カードは「A組1位 vs C/E/F/H/I組3位」等のラベル表記
  - **R16以降**: 日付のみ確定（KO時刻・会場は未定）、対戦カードは「73試合勝者 vs 75試合勝者」等のブラケットベース表記
- `players.json`: **21カ国の現代表メンバー実データ**（韓国・ハイチ・チュニジア・コートジボワール・ベルギー・日本・フランス・コロンビア・ニュージーランド・メキシコ・スウェーデン・ブラジル・キュラソー・オーストリア・カーボベルデ・クロアチア・ヨルダン・コンゴ民主共和国・スコットランド・ポルトガル・スイス）。各選手: 氏名 / ポジション / 生年月日 / 所属クラブ。`goals` / `assists` フィールドは保持しているが**未使用**（`utils/computePlayerStats.ts` が `matches.json` から実行時集計）。出典は worldcdb.com の各国ページ（2026-05-18 取得、スコットランド・ポルトガル・スイスは 2026-05-20 取得）。他27カ国は未登録。

### ライブ更新の枠組み

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

### Sofascore 連携

ライブ情報源として **Sofascore** を採用。`services/sofascoreSource.ts` の `SofascoreLiveSource` が以下を実装:

| エンドポイント | 用途 |
|---|---|
| `/event/{id}` | ステータス・スコア・isLive |
| `/event/{id}/incidents` | ゴール・カード・交代 |

**CORS 対策**: `vite.config.ts` で `/sofascore-api/*` → `https://api.sofascore.com/api/v1/*` のリバースプロキシを設定（dev server のみ有効）。本番デプロイ時は別途リバースプロキシが必要。

**試合ID マッピング**: `public/data/sofascore_mapping.json` にローカル試合ID (`m001` 等) と Sofascore event ID (`15186710` 等) の対応を保存。トーナメントID: `16`、シーズン: `58210` (2026)。現在は R1 の 15 試合分のみ登録。未登録試合はライブ更新スキップ (graceful)。

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

**残作業**: 残り 89 試合の Sofascore ID を `/unique-tournament/16/season/58210/events/next/{0..5}` で取得して mapping に追記。本番運用前に完了させる。

### 順位表・スタッツの自動導出

| 表示 | 計算ロジック | 入力データ |
|------|-------------|-----------|
| 順位表 (`/standings`) | `utils/computeStandings.ts` | `teams.json` + `matches.json` の `stage="group" && status="finished"` |
| スタッツ得点・アシスト (`/stats`) | `utils/computePlayerStats.ts` | `players.json` + `matches.json` の `status="finished"` |

得点者・アシストの紐付けルール: `Goal.playerId` (players.json 参照) があればそれを使い、なければ `Goal.playerName` を `players.json` の `name` と完全一致で検索。どちらも該当しなければチーム側の集計のみで個人は計上されない。自殺点 (`type="own"`) は得点者にカウントしない。
- `team_details.json`: 48カ国分のチーム史データ（大陸・**世界ランク**・監督（氏名・国籍）・出場回数・初出場・前回出場・最高成績）。出典 Wikipedia（各国代表記事のインフォボックス、2026-05-18 取得、世界ランクは 2026/4/1 時点）。FIFA公式と worldcdb.com には監督・ランキング情報がないため Wikipedia から取得。

### 年齢計算

`utils/age.ts` の `calculateAge(birthDate)` が「2026-06-11 開幕日時点」での満年齢を返す。観覧時刻に依存しない安定値。`PlayerRoster` 表示用。

### TBD 試合の表示

`Match` 型に `homeTeamLabel` / `awayTeamLabel`（optional）を追加。`homeTeamId` が `teams.json` に存在しない場合は label を表示する。`MatchCard` / `MatchResultCard` / `ScoreBoard` がこのフォールバックを実装。`utils/team.ts` の `teamDisplay()` がヘルパ。

### チーム詳細ページ

`/teams/:id`（`TeamDetailPage`）。順位表のチーム名、試合カードのチーム名、試合詳細のチーム名すべてからリンク。ヘッダ（国旗・国名）の下に**タブ切替**（「チーム詳細」/「選手一覧」、`useState` でローカル管理）を置き、内容を出し分ける:

- **チーム詳細タブ**: `TeamProfile`（大陸 / 最高成績 / 出場回数 / 初出場 / 前回出場）＋ `TeamHistory`（過去の年別成績）
- **選手一覧タブ**: `PlayerRoster`（選手一覧）

データソース: `public/data/team_details.json`（48チーム分）。出典は Wikipedia 英語版「National team appearances in the FIFA World Cup」（2026-05-18 取得）。

### 国旗の表示

Windows 等で Unicode 国旗絵文字が正しく描画されないため、`components/common/Flag.tsx` が flagcdn.com の SVG を `<img>` で表示する。`Team.isoCode` (ISO 3166-1 alpha-2、英国構成国は `gb-eng` / `gb-sct`) を URL に使用。表示箇所:

- 順位表 (`StandingsRow`)
- 日程・結果カード (`TeamLink` 経由で MatchCard / BracketMatch)
- 試合詳細スコアボード (`ScoreBoard`)
- チーム詳細ヘッダ (`TeamDetailPage`)

外部ホスト依存だが、研究用途ではなくランタイム画像として `<img>` で取得するため許可リスト管理対象外。

### チーム名のクリック対応

`components/common/TeamLink.tsx` がチームが `teams.json` に存在すれば `/teams/:id` へのリンクを返し、TBD ラベル（例「A組1位」）の場合はリンクなし span を返す。

試合カード（MatchCard / BracketMatch）は外側を `<Link>` から `<div role="link" onClick + onKeyDown>` に変更。内側のチーム名は `TeamLink` で個別リンク、`stopPropagation` で親の navigate を抑止。

### トーナメント表ビュー

`components/schedule/BracketView.tsx` が**左右対称ブラケット**を表示:

```
[左R32]→[左R16]→[左QF]→[左SF]  [決勝+3位決定戦]  [右SF]←[右QF]←[右R16]←[右R32]
```

- 左半分は SF 101 に集約する側、右半分は SF 102 に集約する側
- ブラケット配列 (`LEFT_R32` / `RIGHT_R32` など) はハードコード。並び順は次ラウンドのペアリング順
- 中央列は決勝カード + 3位決定戦（下に小さく）
- 各セルは `BracketMatch.tsx` のコンパクトカード
- 横スクロール対応

### 試合番号の表示

R32 以降の TBD ラベル（例「73試合勝者」）が指す試合を見分けられるよう、各試合カード／詳細に FIFA の試合番号（1〜104）を表示する。`utils/matchNumber.ts` の `matchNumber()` が `m073` → 73 のように ID からパース。表示位置:

- `MatchCard`（日程）: 左上にバッジ「#73」
- `MatchResultCard`（試合結果一覧）: 左上にバッジ「#73」
- `ScoreBoard`（試合詳細）: メタ行に金バッジ「第73試合」
- `players.json`: 既存の主要選手リスト（イタリア除く）。全選手 `goals: 0, assists: 0`。

UI 側の対応:
- 順位表: `played=0` のときは「上位2チーム進出」マーカーを非表示にし、凡例を「未開催（順位は仮表示）」に切替。
- スタッツ: 得点・アシストとも 0 の場合は「まだ得点はありません / まだアシストはありません」を表示。

### 過去の大会ページ

`/past`（`PastTournamentsPage`）が 1930〜2022 年の歴代W杯を**新しい順**に一覧表示。出典は `public/data/world_cup_hosts.json`（year ≤ 2022 でフィルタ）。各行クリックで `/past/:year`（`PastTournamentDetailPage`）へ。

詳細ページの表示項目（`public/data/world_cup_results.json`、1大会1エントリ）:

- **結果**: 1位／2位／3位／4位（国名）
- **個人賞**: ゴールデンボール（最優秀選手）／シルバーボール／ブロンズボール／ゴールデンブーツ（得点王）／ゴールデングローブ（最優秀GK）／ベストヤングプレーヤー（最優秀若手選手）／ベストゴール

各賞は `{ player, nationality }`（選手名＋国籍、いずれも手入力テキスト）。`world_cup_results.json` は 1930〜2022 の22大会分。結果（1〜4位）と一部の賞は worldcdb.com の各大会ページ（2026-05-20 取得）から入力済み。古い大会はゴールデンボール・GK賞・ベストゴール等が未制定/未掲載のため空欄。1930年の3・4位も出典に記載がなく空欄。データ追記はファイルを直接編集する運用。型は `src/types/worldCupResult.ts`。

詳細ページ下部には**トーナメント表**も表示。データは `public/data/world_cup_knockouts.json`（`{ year, matches: KnockoutMatch[] }`）。`KnockoutMatch` は `round`(round16/quarter/semi/third/final) / `team1` / `score1` / `team2` / `score2` / `winner`(1|2) / `note`(延長・PK・再試合)。出典は worldcdb.com の各大会決勝トーナメントページ（`{NN}{country}final.htm`、2026-05-20 取得）。ノックアウト方式のある19大会を収録（決勝リーグ総当たり方式の 1950・1974・1978 は対象外）。表示は `components/past/PastBracket.tsx` がラウンドごとの列でブラケット風に描画、3位決定戦は別枠。勝者を太字＋濃色で強調。

## 情報収集（ネットリサーチ）ポリシー

このプロジェクトでは Claude による自発的なネットリサーチを制限する。

- **許可リスト**: [RESEARCH_SOURCES.md](./RESEARCH_SOURCES.md) に記載されている URL／ドメインのみ `WebFetch` 可。
- **会話内 URL**: ユーザーがチャットで貼った URL は、その会話に限り `WebFetch` 可。
- **WebSearch（汎用検索）は原則禁止**。必要なときは Claude からユーザーに「○○ を検索したいが許可するか？」と確認すること。
- **新しい情報源が欲しい場合**: ユーザーに URL を送ってもらうか、`RESEARCH_SOURCES.md` への追記を依頼する。Claude が勝手にドメインを増やさない。
- 内部ドキュメント参照（ローカルファイルの `Read`、リポジトリ内 `Grep` 等）は本ポリシーの対象外。

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
