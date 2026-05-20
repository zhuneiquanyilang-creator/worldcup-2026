import { useMemo } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { useMatches } from "@/hooks/useMatches";
import { useTeamMap } from "@/hooks/useTeams";
import { TopScorers } from "@/components/stats/TopScorers";
import { TopAssists } from "@/components/stats/TopAssists";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import { computePlayerStats } from "@/utils/computePlayerStats";
import styles from "./StatsPage.module.css";

export function StatsPage() {
  const playersRes = usePlayers();
  const teamsRes = useTeamMap();
  const matchesRes = useMatches();

  const playersWithStats = useMemo(() => {
    if (playersRes.status !== "ready" || matchesRes.status !== "ready") return [];
    const stats = computePlayerStats(playersRes.data, matchesRes.data);
    return playersRes.data.map((p) => {
      const s = stats.get(p.id);
      return {
        ...p,
        goals: s?.goals ?? 0,
        assists: s?.assists ?? 0,
      };
    });
  }, [playersRes, matchesRes]);

  if (
    playersRes.status === "loading" ||
    teamsRes.status === "loading" ||
    matchesRes.status === "loading"
  ) {
    return <Loading />;
  }
  if (playersRes.status === "error") return <ErrorMessage message={playersRes.error} />;
  if (teamsRes.status === "error") return <ErrorMessage message={teamsRes.error} />;
  if (matchesRes.status === "error") return <ErrorMessage message={matchesRes.error} />;

  return (
    <div>
      <h1>スタッツ</h1>
      <div className={styles.grid}>
        <TopScorers players={playersWithStats} teamMap={teamsRes.map} />
        <TopAssists players={playersWithStats} teamMap={teamsRes.map} />
      </div>
    </div>
  );
}
