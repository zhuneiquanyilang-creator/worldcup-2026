import { useSearchParams } from "react-router-dom";
import type { Match } from "@/types/match";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import { ScoreBoard } from "./ScoreBoard";
import { MatchEvents } from "./MatchEvents";
import { CombinedFormation } from "./CombinedFormation";
import styles from "./MatchDetail.module.css";

type Props = {
  match: Match;
  teamMap: Map<string, Team>;
  playerMap: Map<string, Player>;
};

type Tab = "events" | "formation";
const VALID_TABS: Tab[] = ["events", "formation"];

export function MatchDetail({ match, teamMap, playerMap }: Props) {
  const home = teamMap.get(match.homeTeamId);
  const away = teamMap.get(match.awayTeamId);
  // 選択中のタブを URL クエリ (?tab=formation) に保存。
  // チーム詳細などへ遷移 → ブラウザ戻るで同じタブに復帰する。
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: Tab = VALID_TABS.includes(raw as Tab) ? (raw as Tab) : "events";
  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    if (t === "events") next.delete("tab");
    else next.set("tab", t);
    setParams(next, { replace: true });
  };

  const hasFormations = Boolean(match.homeFormation || match.awayFormation);
  const allSubs = match.substitutions ?? [];
  const homeSubs = allSubs.filter((s) => s.teamId === match.homeTeamId);
  const awaySubs = allSubs.filter((s) => s.teamId === match.awayTeamId);
  const allBookings = match.bookings ?? [];
  const homeBookings = allBookings.filter((b) => b.teamId === match.homeTeamId);
  const awayBookings = allBookings.filter((b) => b.teamId === match.awayTeamId);
  // ゴールはオウンゴール対応のため CombinedFormation 側で teamId 振り分けする
  // (前は home/away credit でフィルタしていたが、OG だけ反対チームの選手に
  // 帰属させる必要があり applySubsToLineup に全ゴール + teamId を渡す形に統一)。
  const allGoals = match.goals ?? [];

  return (
    <div className={styles.wrapper}>
      <ScoreBoard match={match} homeTeam={home} awayTeam={away} />

      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setTab("events")}
          className={tab === "events" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        >
          試合経過
        </button>
        <button
          type="button"
          onClick={() => setTab("formation")}
          className={tab === "formation" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          disabled={!hasFormations}
          title={hasFormations ? "" : "フォーメーションデータがありません"}
        >
          フォーメーション
        </button>
      </div>

      {tab === "events" && (
        <MatchEvents match={match} teamMap={teamMap} playerMap={playerMap} />
      )}

      {tab === "formation" && (
        hasFormations ? (
          <CombinedFormation
            homeTeam={home}
            homeTeamId={match.homeTeamId}
            homeLabel={match.homeTeamLabel}
            homeFormation={match.homeFormation}
            homeSubs={homeSubs}
            homeBookings={homeBookings}
            awayTeam={away}
            awayTeamId={match.awayTeamId}
            awayLabel={match.awayTeamLabel}
            awayFormation={match.awayFormation}
            awaySubs={awaySubs}
            awayBookings={awayBookings}
            goals={allGoals}
            playerMap={playerMap}
          />
        ) : (
          <p className={styles.empty}>フォーメーションのデータがありません。</p>
        )
      )}
    </div>
  );
}
