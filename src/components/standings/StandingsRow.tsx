import { Link } from "react-router-dom";
import type { Standing } from "@/types/standing";
import type { Team } from "@/types/team";
import type { TeamLiveStatus } from "@/utils/liveTeamStatus";
import { Flag } from "@/components/common/Flag";
import styles from "./StandingsTable.module.css";

type Props = {
  rank: number;
  standing: Standing;
  team: Team | undefined;
  showQualifiedMarker?: boolean;
  liveStatus?: TeamLiveStatus;
};

const LIVE_LABEL: Record<TeamLiveStatus, string> = {
  winning: "ライブ中 (勝利)",
  losing: "ライブ中 (敗北)",
  drawing: "ライブ中 (引き分け)",
};

export function StandingsRow({
  rank,
  standing,
  team,
  showQualifiedMarker = true,
  liveStatus,
}: Props) {
  const qualified = showQualifiedMarker && rank <= 2;
  const dot = liveStatus ? (
    <span
      className={`${styles.liveDot} ${styles[liveStatus]}`}
      aria-label={LIVE_LABEL[liveStatus]}
      title={LIVE_LABEL[liveStatus]}
    />
  ) : null;

  return (
    <tr className={qualified ? styles.qualified : undefined}>
      <td className={styles.rank}>{rank}</td>
      <td className={styles.team}>
        {team ? (
          <Link to={`/teams/${team.id}`} className={styles.teamLink}>
            <Flag isoCode={team.isoCode} size={18} alt={team.name} />
            <span>{team.name}</span>
            {dot}
          </Link>
        ) : (
          <span>
            {standing.teamId}
            {dot}
          </span>
        )}
      </td>
      <td>{standing.played}</td>
      <td>{standing.won}</td>
      <td>{standing.drawn}</td>
      <td>{standing.lost}</td>
      <td>{standing.goalsFor}</td>
      <td>{standing.goalsAgainst}</td>
      <td>{standing.goalDiff > 0 ? `+${standing.goalDiff}` : standing.goalDiff}</td>
      <td className={styles.points}>{standing.points}</td>
    </tr>
  );
}
