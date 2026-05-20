import { Link, useParams } from "react-router-dom";
import { useMatches } from "@/hooks/useMatches";
import { useTeamMap } from "@/hooks/useTeams";
import { usePlayerMap } from "@/hooks/usePlayers";
import { MatchDetail } from "@/components/matches/MatchDetail";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import styles from "./MatchDetailPage.module.css";

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const matchesRes = useMatches();
  const teamsRes = useTeamMap();
  const playersRes = usePlayerMap();

  if (
    matchesRes.status === "loading" ||
    teamsRes.status === "loading" ||
    playersRes.status === "loading"
  ) {
    return <Loading />;
  }
  if (matchesRes.status === "error") return <ErrorMessage message={matchesRes.error} />;
  if (teamsRes.status === "error") return <ErrorMessage message={teamsRes.error} />;
  if (playersRes.status === "error") return <ErrorMessage message={playersRes.error} />;

  const match = matchesRes.data.find((m) => m.id === id);
  if (!match) {
    return (
      <div>
        <Link to="/matches" className={styles.back}>← 試合一覧へ</Link>
        <ErrorMessage message="該当する試合が見つかりませんでした。" />
      </div>
    );
  }

  return (
    <div>
      <Link to="/matches" className={styles.back}>← 試合一覧へ</Link>
      <MatchDetail match={match} teamMap={teamsRes.map} playerMap={playersRes.map} />
    </div>
  );
}
