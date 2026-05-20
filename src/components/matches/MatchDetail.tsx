import { useState } from "react";
import type { Match } from "@/types/match";
import type { Team } from "@/types/team";
import type { Player } from "@/types/player";
import { ScoreBoard } from "./ScoreBoard";
import { MatchEvents } from "./MatchEvents";
import { CombinedFormation } from "./CombinedFormation";
import { MatchStats } from "./MatchStats";
import styles from "./MatchDetail.module.css";

type Props = {
  match: Match;
  teamMap: Map<string, Team>;
  playerMap: Map<string, Player>;
};

type Tab = "events" | "stats" | "formation";

export function MatchDetail({ match, teamMap, playerMap }: Props) {
  const home = teamMap.get(match.homeTeamId);
  const away = teamMap.get(match.awayTeamId);
  const [tab, setTab] = useState<Tab>("events");

  const hasFormations = Boolean(match.homeFormation || match.awayFormation);
  const hasStats = Boolean(match.stats);
  const allSubs = match.substitutions ?? [];
  const homeSubs = allSubs.filter((s) => s.teamId === match.homeTeamId);
  const awaySubs = allSubs.filter((s) => s.teamId === match.awayTeamId);
  const allBookings = match.bookings ?? [];
  const homeBookings = allBookings.filter((b) => b.teamId === match.homeTeamId);
  const awayBookings = allBookings.filter((b) => b.teamId === match.awayTeamId);
  const allGoals = match.goals ?? [];
  const homeGoals = allGoals.filter((g) => g.teamId === match.homeTeamId);
  const awayGoals = allGoals.filter((g) => g.teamId === match.awayTeamId);

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
          onClick={() => setTab("stats")}
          className={tab === "stats" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
          disabled={!hasStats}
          title={hasStats ? "" : "スタッツのデータがありません"}
        >
          スタッツ
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

      {tab === "stats" && (
        <MatchStats
          stats={match.stats}
          homeTeam={home}
          homeLabel={match.homeTeamLabel}
          awayTeam={away}
          awayLabel={match.awayTeamLabel}
        />
      )}

      {tab === "formation" && (
        hasFormations ? (
          <CombinedFormation
            homeTeam={home}
            homeLabel={match.homeTeamLabel}
            homeFormation={match.homeFormation}
            homeSubs={homeSubs}
            homeBookings={homeBookings}
            homeGoals={homeGoals}
            awayTeam={away}
            awayLabel={match.awayTeamLabel}
            awayFormation={match.awayFormation}
            awaySubs={awaySubs}
            awayBookings={awayBookings}
            awayGoals={awayGoals}
          />
        ) : (
          <p className={styles.empty}>フォーメーションのデータがありません。</p>
        )
      )}
    </div>
  );
}
