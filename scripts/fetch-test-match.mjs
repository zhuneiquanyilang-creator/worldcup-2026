/**
 * テスト試合 (test_che_tot, Sofascore event 16087727) のデータを取得し、
 * dev サーバーの書き込みエンドポイント経由で match_results.json に保存する。
 *
 * 使い方: node scripts/fetch-test-match.mjs
 *  (dev サーバー `npm run dev` が起動していること)
 *
 * 試合終了済みのため `useLivePolling` の自動取得対象外なので、一回限りの
 * 取り込み用ユーティリティ。`services/sofascoreSource.ts` と同じ
 * 変換ロジックを再実装している（独立スクリプト化のため）。
 */

const PROXY = "http://localhost:5173/sofascore-api";
const WRITE = "http://localhost:5173/__dev/match-results";
const MATCH_ID = "test_che_tot";
const EVENT_ID = 16087727;
const HOME_TEAM_ID = "CHE";
const AWAY_TEAM_ID = "TOT";

const GOAL_CLASS = { regular: "normal", penalty: "penalty", ownGoal: "own" };
const CARD_CLASS = { yellow: "Y", red: "R", yellowRed: "Y2R" };

function mapStatus(s) {
  const t = s?.type;
  if (t === "finished") return "finished";
  if (t === "inprogress") return "live";
  return "scheduled";
}

async function main() {
  const eventRes = await fetch(`${PROXY}/event/${EVENT_ID}`);
  if (!eventRes.ok) throw new Error(`event fetch: ${eventRes.status}`);
  const eventJson = await eventRes.json();
  const ev = eventJson.event;

  const incRes = await fetch(`${PROXY}/event/${EVENT_ID}/incidents`);
  if (!incRes.ok) throw new Error(`incidents fetch: ${incRes.status}`);
  const incJson = await incRes.json();
  const incidents = incJson.incidents ?? [];

  const update = { matchId: MATCH_ID };
  update.status = mapStatus(ev.status);
  if (ev.status?.description) update.liveLabel = ev.status.description;
  if (typeof ev.homeScore?.current === "number" && typeof ev.awayScore?.current === "number") {
    update.score = { home: ev.homeScore.current, away: ev.awayScore.current };
  }
  if (typeof ev.homeScore?.penalties === "number" && typeof ev.awayScore?.penalties === "number") {
    update.penaltyScore = { home: ev.homeScore.penalties, away: ev.awayScore.penalties };
  }

  const goals = [];
  const bookings = [];
  const subs = [];
  for (const i of incidents) {
    const teamId = i.isHome ? HOME_TEAM_ID : AWAY_TEAM_ID;
    const minute = typeof i.time === "number" ? i.time : 0;
    if (i.incidentType === "goal") {
      goals.push({
        minute,
        teamId,
        playerName: i.player?.name,
        assistPlayerName: i.assist1?.name,
        type: GOAL_CLASS[i.incidentClass] ?? "normal",
      });
    } else if (i.incidentType === "card") {
      bookings.push({
        minute,
        teamId,
        playerName: i.player?.name,
        type: CARD_CLASS[i.incidentClass] ?? "Y",
      });
    } else if (i.incidentType === "substitution") {
      subs.push({
        minute,
        teamId,
        inName: i.playerIn?.name,
        outName: i.playerOut?.name,
      });
    }
  }
  // 時系列に並べる
  goals.sort((a, b) => a.minute - b.minute);
  bookings.sort((a, b) => a.minute - b.minute);
  subs.sort((a, b) => a.minute - b.minute);

  if (goals.length) update.goals = goals;
  if (bookings.length) update.bookings = bookings;
  if (subs.length) update.substitutions = subs;
  update.fetchedAt = new Date().toISOString();

  console.log("--- 構築された LiveUpdate ---");
  console.log(JSON.stringify(update, null, 2));

  const payload = { [MATCH_ID]: update };
  const writeRes = await fetch(WRITE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!writeRes.ok) {
    throw new Error(`write failed: ${writeRes.status} ${writeRes.statusText}`);
  }
  const ok = await writeRes.json();
  console.log(`\n match_results.json updated. total entries: ${ok.count}`);
}

main().catch((e) => {
  console.error("error:", e.message);
  process.exit(1);
});
