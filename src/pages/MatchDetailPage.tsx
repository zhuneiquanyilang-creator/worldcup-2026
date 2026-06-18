import { useNavigate, useParams } from "react-router-dom";
import { useMatches } from "@/hooks/useMatches";
import { useTeamMap } from "@/hooks/useTeams";
import { usePlayerMap } from "@/hooks/usePlayers";
import { MatchDetail } from "@/components/matches/MatchDetail";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import styles from "./MatchDetailPage.module.css";

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const matchesRes = useMatches();
  const teamsRes = useTeamMap();
  const playersRes = usePlayerMap();
  // 履歴を 1 つ戻す。試合一覧のフィルタや順位表のグループ等、
  // 遷移元の URL クエリ状態がそのまま復元される。
  // 直接 URL 起動などで履歴がなければ /schedule にフォールバック。
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/schedule");
  };

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
        <button type="button" onClick={goBack} className={styles.back}>← 戻る</button>
        <ErrorMessage message="該当する試合が見つかりませんでした。" />
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={goBack} className={styles.back}>← 戻る</button>
      <MatchDetail match={match} teamMap={teamsRes.map} playerMap={playersRes.map} />
    </div>
  );
}
