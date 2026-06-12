import type { Match } from "@/types/match";
import type { Standing } from "@/types/standing";
import type { Team } from "@/types/team";
import { getTeamLiveStatus } from "@/utils/liveTeamStatus";
import { StandingsRow } from "./StandingsRow";
import styles from "./StandingsTable.module.css";

type Props = {
  standings: Standing[];
  teamMap: Map<string, Team>;
  /** 全試合データ。ライブ中の試合からチーム別ライブ状態を判定するのに使う。 */
  matches?: Match[];
};

function compare(a: Standing, b: Standing) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  return b.goalsFor - a.goalsFor;
}

export function StandingsTable({ standings, teamMap, matches }: Props) {
  const sorted = [...standings].sort(compare);
  const noMatchesPlayed = sorted.every((s) => s.played === 0);

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>順位</th>
            <th className={styles.team}>チーム</th>
            <th title="試合数">試</th>
            <th title="勝">勝</th>
            <th title="分">分</th>
            <th title="負">負</th>
            <th title="得点">得</th>
            <th title="失点">失</th>
            <th title="得失差">差</th>
            <th>勝点</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <StandingsRow
              key={s.teamId}
              rank={i + 1}
              standing={s}
              team={teamMap.get(s.teamId)}
              showQualifiedMarker={!noMatchesPlayed}
              liveStatus={matches ? getTeamLiveStatus(s.teamId, matches) : undefined}
            />
          ))}
        </tbody>
      </table>
      {noMatchesPlayed ? (
        <p className={styles.legend}>未開催（順位は仮表示）</p>
      ) : (
        <p className={styles.legend}>
          <span className={styles.legendDot} aria-hidden /> 上位2チームが決勝トーナメント進出
        </p>
      )}
    </div>
  );
}
