import type { Match } from "@/types/match";
import type { Team } from "@/types/team";
import { formatDateJa } from "@/utils/date";
import { MatchCard } from "./MatchCard";
import styles from "./ScheduleDayGroup.module.css";

type Props = {
  isoDate: string;
  matches: Match[];
  teamMap: Map<string, Team>;
};

export function ScheduleDayGroup({ isoDate, matches, teamMap }: Props) {
  return (
    <section className={styles.day}>
      <h2 className={styles.heading}>{formatDateJa(isoDate)}</h2>
      <div className={styles.list}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} teamMap={teamMap} />
        ))}
      </div>
    </section>
  );
}
