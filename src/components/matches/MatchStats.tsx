import type { MatchStats as MatchStatsData } from "@/types/match";
import type { Team } from "@/types/team";
import styles from "./MatchStats.module.css";

type Props = {
  stats?: MatchStatsData;
  homeTeam: Team | undefined;
  homeLabel?: string;
  awayTeam: Team | undefined;
  awayLabel?: string;
};

type Row = {
  label: string;
  home: number;
  away: number;
  /** 表示時のフォーマッタ */
  format: (v: number) => string;
};

export function MatchStats({ stats, homeTeam, homeLabel, awayTeam, awayLabel }: Props) {
  const homeName = homeTeam?.name ?? homeLabel ?? "ホーム";
  const awayName = awayTeam?.name ?? awayLabel ?? "アウェイ";

  if (!stats || (!stats.possession && !stats.xG && !stats.shots && !stats.shotsOnTarget)) {
    return (
      <section className={styles.section}>
        <p className={styles.empty}>スタッツのデータはまだありません。</p>
      </section>
    );
  }

  const rows: Row[] = [];
  if (stats.possession) {
    rows.push({
      label: "ボール支配率",
      home: stats.possession.home,
      away: stats.possession.away,
      format: (v) => `${Math.round(v)}%`,
    });
  }
  if (stats.xG) {
    rows.push({
      label: "ゴール期待値 (xG)",
      home: stats.xG.home,
      away: stats.xG.away,
      format: (v) => v.toFixed(2),
    });
  }
  if (stats.shots) {
    rows.push({
      label: "シュート",
      home: stats.shots.home,
      away: stats.shots.away,
      format: (v) => String(v),
    });
  }
  if (stats.shotsOnTarget) {
    rows.push({
      label: "枠内シュート",
      home: stats.shotsOnTarget.home,
      away: stats.shotsOnTarget.away,
      format: (v) => String(v),
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <span className={styles.teamName}>{homeName}</span>
        <span></span>
        <span className={`${styles.teamName} ${styles.teamNameAway}`}>{awayName}</span>
      </div>

      <ul className={styles.list}>
        {rows.map((r) => (
          <StatRow key={r.label} row={r} />
        ))}
      </ul>
    </section>
  );
}

function StatRow({ row }: { row: Row }) {
  const total = row.home + row.away;
  const homePct = total > 0 ? (row.home / total) * 100 : 50;
  const awayPct = 100 - homePct;
  return (
    <li className={styles.row}>
      <div className={styles.label}>{row.label}</div>
      <div className={styles.barWrap}>
        <span className={`${styles.value} ${styles.valueHome}`}>{row.format(row.home)}</span>
        <div className={styles.barTrack}>
          <div className={styles.barHome} style={{ width: `${homePct}%` }} />
          <div className={styles.barAway} style={{ width: `${awayPct}%` }} />
        </div>
        <span className={`${styles.value} ${styles.valueAway}`}>{row.format(row.away)}</span>
      </div>
    </li>
  );
}
