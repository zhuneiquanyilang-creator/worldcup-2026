import type { Match } from "@/types/match";
import type { Team } from "@/types/team";
import { matchNumber } from "@/utils/matchNumber";
import { BracketMatch } from "./BracketMatch";
import styles from "./BracketView.module.css";

type Props = {
  matches: Match[];
  teamMap: Map<string, Team>;
};

// SF 101 に集約する左半分（R32→R16→QF→SF 101）
const LEFT_R32 = [73, 75, 74, 77, 76, 78, 79, 80];
const LEFT_R16 = [89, 90, 91, 92];
const LEFT_QF = [97, 98];
const LEFT_SF = [101];

// SF 102 に集約する右半分（R32→R16→QF→SF 102）
const RIGHT_R32 = [83, 84, 81, 82, 86, 88, 85, 87];
const RIGHT_R16 = [93, 94, 95, 96];
const RIGHT_QF = [99, 100];
const RIGHT_SF = [102];

function pickByOrder(matches: Match[], order: number[]): Match[] {
  return order
    .map((n) => matches.find((m) => matchNumber(m.id) === n))
    .filter((m): m is Match => Boolean(m));
}

type Column = { title: string; matches: Match[] };

function Column({ col, teamMap }: { col: Column; teamMap: Map<string, Team> }) {
  return (
    <div className={styles.column}>
      <div className={styles.columnTitle}>{col.title}</div>
      <div className={styles.cards}>
        {col.matches.map((m) => (
          <BracketMatch key={m.id} match={m} teamMap={teamMap} />
        ))}
      </div>
    </div>
  );
}

export function BracketView({ matches, teamMap }: Props) {
  const get = (stage: Match["stage"]) => matches.filter((m) => m.stage === stage);

  const leftColumns: Column[] = [
    { title: "ラウンド32", matches: pickByOrder(get("round32"), LEFT_R32) },
    { title: "ラウンド16", matches: pickByOrder(get("round16"), LEFT_R16) },
    { title: "準々決勝", matches: pickByOrder(get("quarter"), LEFT_QF) },
    { title: "準決勝", matches: pickByOrder(get("semi"), LEFT_SF) },
  ];

  // 右側は中央に向かって SF→QF→R16→R32 の順で並べる
  const rightColumns: Column[] = [
    { title: "準決勝", matches: pickByOrder(get("semi"), RIGHT_SF) },
    { title: "準々決勝", matches: pickByOrder(get("quarter"), RIGHT_QF) },
    { title: "ラウンド16", matches: pickByOrder(get("round16"), RIGHT_R16) },
    { title: "ラウンド32", matches: pickByOrder(get("round32"), RIGHT_R32) },
  ];

  const fin = get("final")[0];
  const third = get("third")[0];

  return (
    <div>
      <div className={styles.bracket}>
        {leftColumns.map((col, i) => (
          <Column key={`L${i}`} col={col} teamMap={teamMap} />
        ))}

        <div className={styles.center}>
          <div className={styles.finalTitle}>決勝</div>
          {fin && <BracketMatch match={fin} teamMap={teamMap} />}
          {third && (
            <div className={styles.thirdWrap}>
              <div className={styles.thirdTitle}>3位決定戦</div>
              <BracketMatch match={third} teamMap={teamMap} />
            </div>
          )}
        </div>

        {rightColumns.map((col, i) => (
          <Column key={`R${i}`} col={col} teamMap={teamMap} />
        ))}
      </div>

      <p className={styles.note}>
        ※ R16 以降の対戦カードは「73試合勝者」のようなラベル表記です。番号は各カード左上の{" "}
        <span className={styles.numChip}>#73</span> で照合できます。
      </p>
    </div>
  );
}
