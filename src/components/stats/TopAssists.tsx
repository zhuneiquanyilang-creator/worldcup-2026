import type { Player } from "@/types/player";
import type { Team } from "@/types/team";
import { PlayerStatRow } from "./PlayerStatRow";
import styles from "./StatsTable.module.css";

type Props = {
  players: Player[];
  teamMap: Map<string, Team>;
  limit?: number;
};

export function TopAssists({ players, teamMap, limit = 10 }: Props) {
  const sorted = [...players]
    .filter((p) => p.assists > 0)
    .sort((a, b) => b.assists - a.assists || b.goals - a.goals)
    .slice(0, limit);

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>
        <span className={styles.icon}>🎯</span> アシストランキング
      </h2>
      {sorted.length === 0 ? (
        <p className={styles.empty}>まだアシストはありません</p>
      ) : (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>順位</th>
            <th>選手</th>
            <th>所属</th>
            <th className={styles.right}>アシスト</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <PlayerStatRow
              key={p.id}
              rank={i + 1}
              player={p}
              team={teamMap.get(p.teamId)}
              value={p.assists}
              metric="A"
            />
          ))}
        </tbody>
      </table>
      )}
    </section>
  );
}
