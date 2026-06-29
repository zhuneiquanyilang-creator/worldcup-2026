import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTeams } from "@/hooks/useTeams";
import { useTeamDetailMap } from "@/hooks/useTeamDetails";
import { TeamProfile } from "@/components/teams/TeamProfile";
import { TeamHistory } from "@/components/teams/TeamHistory";
import { PlayerRoster } from "@/components/teams/PlayerRoster";
import { TeamResults } from "@/components/teams/TeamResults";
import { Flag } from "@/components/common/Flag";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import styles from "./TeamDetailPage.module.css";

type Tab = "detail" | "roster" | "results";

const TAB_VALUES: Tab[] = ["detail", "roster", "results"];

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const teamsRes = useTeams();
  const detailsRes = useTeamDetailMap();
  // タブ選択を URL クエリ (?tab=roster) で保持。
  // 選手詳細などへ遷移したあと「← 戻る」で履歴を一つ戻ると、ブラウザが
  // クエリ付き URL を復元するため、開いていたタブに自動復帰する。
  // 直接 URL を開いたとき / クエリ無しのときは "detail" を既定。
  const [params, setParams] = useSearchParams();
  const rawTab = params.get("tab");
  const tab: Tab = TAB_VALUES.includes(rawTab as Tab)
    ? (rawTab as Tab)
    : "detail";
  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    if (next === "detail") p.delete("tab");
    else p.set("tab", next);
    // replace: true で履歴を増やさない (タブ切替は 1 ページ内の遷移として扱う)
    setParams(p, { replace: true });
  };
  // 履歴を 1 つ戻す。前のページ (順位表のグループ C / 試合詳細のフォーメーション
  // タブ等) の URL クエリ状態も復元される。
  // 履歴が空の場合 (= 直接 URL で開いた等) は /standings にフォールバック。
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/standings");
  };

  if (teamsRes.status === "loading" || detailsRes.status === "loading") {
    return <Loading />;
  }
  if (teamsRes.status === "error") return <ErrorMessage message={teamsRes.error} />;
  if (detailsRes.status === "error") return <ErrorMessage message={detailsRes.error} />;

  const team = teamsRes.data.find((t) => t.id === id);
  if (!team) {
    return (
      <div>
        <button type="button" onClick={goBack} className={styles.back}>← 戻る</button>
        <ErrorMessage message="該当するチームが見つかりませんでした。" />
      </div>
    );
  }

  const detail = detailsRes.map.get(team.id);

  return (
    <div className={styles.page}>
      <button type="button" onClick={goBack} className={styles.back}>← 戻る</button>

      <header className={styles.header}>
        <Flag isoCode={team.isoCode} size={72} alt={team.name} className={styles.flag} />
        <div>
          <h1 className={styles.name}>{team.name}</h1>
          <p className={styles.sub}>
            <span className={styles.nameEn}>{team.nameEn}</span>
            <span className={styles.groupBadge}>グループ {team.groupId}</span>
          </p>
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          onClick={() => setTab("detail")}
          className={tab === "detail" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        >
          チーム詳細
        </button>
        <button
          type="button"
          onClick={() => setTab("roster")}
          className={tab === "roster" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        >
          選手一覧
        </button>
        <button
          type="button"
          onClick={() => setTab("results")}
          className={tab === "results" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
        >
          試合結果
        </button>
      </div>

      {tab === "detail" && (
        <div className={styles.grid}>
          <TeamProfile detail={detail} />
          {/* 初出場の国 (過去成績データ無し) は「過去の成績」欄を出さない */}
          {detail && detail.pastResults.length > 0 && (
            <TeamHistory results={detail.pastResults} />
          )}
        </div>
      )}
      {tab === "roster" && (
        <div className={styles.grid}>
          <PlayerRoster teamId={team.id} />
        </div>
      )}
      {tab === "results" && (
        <div className={styles.grid}>
          <TeamResults teamId={team.id} />
        </div>
      )}
    </div>
  );
}
