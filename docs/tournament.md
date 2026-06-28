# 大会データ

このファイルは [CLAUDE.md](../CLAUDE.md) から読み込まれる詳細ドキュメント。

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

**実装済み** (`utils/tiebreaker.ts`):

- `sortGroupStandings(standings, matches)` — グループ内の正規ソート。①勝ち点 → ②③④ H2H (再帰) → ⑤⑥⑦ overall+fairplay。
- `compareCrossGroup(a, b)` — 異グループのチーム同士 (3 位ワイルドカード等) 用。①⑤⑥⑦ のみ (H2H 無し)。

組み込み先:
- `StandingsTable` (グループ内、`matches` props で H2H を渡す)
- `ThirdPlaceRanking` (グループ内 3 位確定 → cross-group ソート)
- `resolveMatchTeams.resolveThirdPlaceWildcards` (3 位ワイルドカード解決)

フェアプレーポイントは `computeStandings` が `match.bookings` から集計し `Standing.fairPlayPoints` に持つ。Y=-1 / Y2R=-3 / R=-4 / YR=-5 (CLAUDE.md 規定通り)。Y2R / YR は「2 枚目イエロー / イエロー後の一発レッド」を**単独イベント**として記録する想定 (preceding Y を別エントリで二重計上しない)。

未実装 (⑧⑨ FIFA ランキング): データソース未確保。実装するなら `public/data/fifa_ranking.json` を追加して `compareCrossGroup` / `rankCluster` のフォールバックに足す。

注: `utils/groupClinch.ts` の clinch 判定だけは簡易版のまま (`points → goalDiff → goalsFor`)。clinch は「未来の試合結果を全列挙して順位ロックを判定する」処理で、bookings の列挙はコスト的に非現実なため。clinch が「未確定」と返した場合に実際は確定しているケース (= 過小確定) がありうるが、安全側 (overclinch しない) なので許容。

### 型定義への影響

`MatchStage` に `"round32"` を追加すること（現状未対応）。
順序: `group` → `round32` → `round16` → `quarter` → `semi` → `third` → `final`

### ダミーデータの現状

**現状はすべて「大会開幕前」状態で一貫している**:

- `teams.json` / `groups.json`: 12グループ・48チーム（2025-12-05 抽選結果に準拠、Wikipedia ja 出典）。
- `standings.json`: **廃止**。順位表は `utils/computeStandings.ts` が `matches.json` の `status: "finished"` グループ戦から実行時に導出。試合データを更新するだけで順位表に反映される。
- `matches.json`: **全104試合**の実日程（グループ72 + R32 16 + R16 8 + QF 4 + SF 2 + 3位決定戦 1 + 決勝 1）。すべて `status: "scheduled"`、スコアなし。出典は Wikipedia（2026-05-18 取得）。
  - **R32**: 日付・会場確定、対戦カードは「A組1位 vs C/E/F/H/I組3位」等のラベル表記
  - **R16以降**: 日付・会場・KO時刻すべて確定（2026-05-26 更新、出典 en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage）、対戦カードは「73試合勝者 vs 75試合勝者」等のブラケットベース表記
  - **broadcasters**: 各試合に日本国内放送局コードの配列を保持（出典 FIFA 公式 canadamexicousa2026/scores-fixtures?country=JP、2026-05-26 取得）。DAZN は全 104 試合に独占ストリーミング配信される前提で機械的に付与。**コード → 放送局対応表**（`components/common/BroadcasterBadge.tsx` の `META` と一致）:

    | コード | 放送局 | バッジ表示 | 配色 |
    |---|---|---|---|
    | `nhk-g` | NHK 総合 (地上波) | `G` | 赤地に白文字 (#e60012) |
    | `nhk-bs1` | NHK BS1 (BS) | `BS1` | 青地に白文字 (#0a5cb8) |
    | `nhk-bs4k` | NHK BS4K (4K) | `BS4K` | グレー地に白文字 (#6b6b6b) |
    | `nhk-e` | NHK Eテレ (教育テレビ、深夜枠等) | `E` | 緑地に白文字 (#00a040) |
    | `ntv` | 日本テレビ (地上波) | `日テレ` | 白地に赤テキスト + 赤枠 (#e60019) |
    | `fuji` | フジテレビ (地上波) | `フジ` | 朱赤地に白文字 (#ff6a13) |
    | `dazn` | DAZN (配信、全 104 試合独占) | `DAZN` | 黒地に白文字 (#111) |

    ユーザー向けの凡例は `/regulations` ページ最下部「テレビ放送・配信」セクションにも掲載済み。
- `players/{teamId}.json`: **48カ国全代表メンバー実データを per-team JSON に分割** (`public/data/players/JPN.json` 等、計 48 ファイル × 26 名)。各選手: 氏名 / ポジション / 生年月日 / 所属クラブ。`goals` / `assists` フィールドは保持しているが**未使用**（`utils/computePlayerStats.ts` が `matches.json` から実行時集計）。フロントは `usePlayers` が `teams.json` を起点に 48 並列 fetch して 1 つの `Player[]` に concat。node スクリプトからは `scripts/_lib/players.mjs` の `loadAllPlayers` / `loadTeamPlayers` / `saveTeamPlayers` を使う (例: [`scripts/write-m001-formations.mjs`](../scripts/write-m001-formations.mjs))。出典は worldcdb.com の各国ページ（2026-05-18 取得を皮切りに 5/20 / 5/22 / 5/24 / 5/26 / 5/27 / 5/28 / 5/30 / 5/31 / 6/1 / 6/2 と分割して取得。コロンビアとメキシコは予備 55 名リストから正式 26 名へ更新、ヨルダンは予備 30 名から正式 26 名へ更新）。サウジアラビアは FIFA 公式コードの **KSA** (Kingdom of Saudi Arabia) で teams.json と対応させる。元は 1 ファイル `players.json` だったが、1248 行を超えて差分管理しにくいため per-team に分割 (2026-06-13、`scripts/split-players.mjs` で生成)。
