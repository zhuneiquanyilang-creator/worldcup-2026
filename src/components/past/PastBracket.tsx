import type { KnockoutMatch, KnockoutRound } from "@/types/worldCupResult";
import styles from "./PastBracket.module.css";

type Props = {
  matches: KnockoutMatch[];
};

const COLUMN_ORDER: KnockoutRound[] = ["round16", "quarter", "semi", "final"];

const ROUND_LABEL: Record<KnockoutRound, string> = {
  round16: "ラウンド16",
  quarter: "準々決勝",
  semi: "準決勝",
  third: "3位決定戦",
  final: "決勝",
};

function MatchCard({ match }: { match: KnockoutMatch }) {
  return (
    <div className={styles.match}>
      <div className={`${styles.row} ${match.winner === 1 ? styles.winner : styles.loser}`}>
        <span className={styles.team}>{match.team1}</span>
        <span className={styles.score}>{match.score1}</span>
      </div>
      <div className={`${styles.row} ${match.winner === 2 ? styles.winner : styles.loser}`}>
        <span className={styles.team}>{match.team2}</span>
        <span className={styles.score}>{match.score2}</span>
      </div>
      {match.note && <div className={styles.note}>{match.note}</div>}
    </div>
  );
}

export function PastBracket({ matches }: Props) {
  const byRound = (r: KnockoutRound) => matches.filter((m) => m.round === r);
  const columns = COLUMN_ORDER.filter((r) => byRound(r).length > 0);
  const third = byRound("third")[0];

  if (columns.length === 0) return null;

  return (
    <div className={styles.scroll}>
      <div className={styles.bracket}>
        {columns.map((r) => (
          <div key={r} className={styles.col}>
            <div className={styles.colTitle}>{ROUND_LABEL[r]}</div>
            <div className={styles.colMatches}>
              {byRound(r).map((m, i) => (
                <MatchCard key={i} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {third && (
        <div className={styles.thirdBox}>
          <div className={styles.colTitle}>{ROUND_LABEL.third}</div>
          <MatchCard match={third} />
        </div>
      )}
    </div>
  );
}
