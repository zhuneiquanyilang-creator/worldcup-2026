import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { Standing } from "@/types/standing";
import type { Team } from "@/types/team";
import { Flag } from "@/components/common/Flag";
import styles from "./ThirdPlaceRanking.module.css";

type Props = {
  standings: Standing[];
  teamMap: Map<string, Team>;
};

/** 簡易タイブレーカー（開幕後は utils/tiebreaker.ts へ差し替え予定） */
function compare(a: Standing, b: Standing) {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
  return b.goalsFor - a.goalsFor;
}

const QUALIFY_LIMIT = 8;

export function ThirdPlaceRanking({ standings, teamMap }: Props) {
  const thirdPlaceTeams = useMemo(() => {
    const groups = new Map<string, Standing[]>();
    for (const s of standings) {
      const arr = groups.get(s.groupId) ?? [];
      arr.push(s);
      groups.set(s.groupId, arr);
    }
    const thirds: Standing[] = [];
    for (const group of groups.values()) {
      const sorted = [...group].sort(compare);
      if (sorted.length >= 3) thirds.push(sorted[2]);
    }
    return thirds.sort(compare);
  }, [standings]);

  const noMatchesPlayed = thirdPlaceTeams.every((s) => s.played === 0);

  return (
    <section className={styles.wrapper}>
      <h2 className={styles.heading}>
        3位チーム順位
        <span className={styles.sub}>（上位{QUALIFY_LIMIT}チームが R32 進出）</span>
      </h2>

      {thirdPlaceTeams.length === 0 ? (
        <p className={styles.empty}>3位チームのデータがありません。</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>順位</th>
              <th>組</th>
              <th className={styles.teamCol}>チーム</th>
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
            {thirdPlaceTeams.map((s, i) => {
              const rank = i + 1;
              const qualified = !noMatchesPlayed && rank <= QUALIFY_LIMIT;
              const team = teamMap.get(s.teamId);
              return (
                <tr key={s.teamId} className={qualified ? styles.qualified : undefined}>
                  <td className={styles.rank}>{rank}</td>
                  <td className={styles.group}>{s.groupId}</td>
                  <td className={styles.team}>
                    {team ? (
                      <Link to={`/teams/${team.id}`} className={styles.teamLink}>
                        <Flag isoCode={team.isoCode} size={18} alt={team.name} />
                        <span>{team.name}</span>
                      </Link>
                    ) : (
                      <span>{s.teamId}</span>
                    )}
                  </td>
                  <td>{s.played}</td>
                  <td>{s.won}</td>
                  <td>{s.drawn}</td>
                  <td>{s.lost}</td>
                  <td>{s.goalsFor}</td>
                  <td>{s.goalsAgainst}</td>
                  <td>{s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}</td>
                  <td className={styles.points}>{s.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {noMatchesPlayed ? (
        <p className={styles.legend}>未開催（順位は仮表示）</p>
      ) : (
        <p className={styles.legend}>
          <span className={styles.legendDot} aria-hidden /> 上位{QUALIFY_LIMIT}チームが R32 進出
        </p>
      )}
    </section>
  );
}
