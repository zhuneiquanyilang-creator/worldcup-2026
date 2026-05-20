import type { Player } from "@/types/player";
import type { Team } from "@/types/team";
import { PlayerStatRow } from "./PlayerStatRow";
import styles from "./StatsTable.module.css";

type Props = {
  players: Player[];
  teamMap: Map<string, Team>;
  limit?: number;
};

export function TopScorers({ players, teamMap, limit = 10 }: Props) {
  const sorted = [...players]
    .filter((p) => p.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, limit);

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>
        <span className={styles.icon}>⚽</span> 得点ランキング
      </h2>
      {sorted.length === 0 ? (
        <p className={styles.empty}>まだ得点はありません</p>
      ) : (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>順位</th>
            <th>選手</th>
            <th>所属</th>
            <th className={styles.right}>得点</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <PlayerStatRow
              key={p.id}
              rank={i + 1}
              player={p}
              team={teamMap.get(p.teamId)}
              value={p.goals}
              metric="G"
            />
          ))}
        </tbody>
      </table>
      )}
    </section>
  );
}
