import type { Match } from "@/types/match";
import type { Team } from "@/types/team";
import { matchNumber } from "@/utils/matchNumber";
import { BracketMatch } from "./BracketMatch";
import styles from "./BracketView.module.css";

type Props = {
  matches: Match[];
  teamMap: Map<string, Team>;
};

/**
 * 左→右の縦長ブラケット。一番左の R32 列に 16 試合を縦に並べ、右に向かって
 * 半分ずつにまとまり、最右列に決勝＋3位決定戦が来る。
 *
 * 各列ではカードを 2 枚ずつ「ペア」に括り、ペアごとに「]」型の進出線
 * (`.pair::after`) と次列へ伸びる水平線 (`.pair::before`) を CSS で描画する。
 *
 * カードの位置揃え: 各 .cards に `justify-content: space-around` をかけている
 * ため、列ごとにカード数が半分になっても親カードの中央に揃う
 * (R32 16枚→R16 8枚で各 R16 がそのペア中央に来る)。
 */

// R32 の縦並び順（隣接ペアが同じ R16 試合に進むようにする）
// LEFT 側 (m089-m092 系列) → RIGHT 側 (m093-m096 系列) の順で連結
const R32_ORDER = [73, 75, 74, 77, 76, 78, 79, 80, 83, 84, 81, 82, 86, 88, 85, 87];
const R16_ORDER = [89, 90, 91, 92, 93, 94, 95, 96];
const QF_ORDER = [97, 98, 99, 100];
const SF_ORDER = [101, 102];
const FINAL_NUM = 104;
const THIRD_NUM = 103;

function pickByOrder(matches: Match[], stage: Match["stage"], order: number[]): Match[] {
  const stageMatches = matches.filter((m) => m.stage === stage);
  return order
    .map((n) => stageMatches.find((m) => matchNumber(m.id) === n))
    .filter((m): m is Match => Boolean(m));
}

function pairUp<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

const COLUMNS: { title: string; stage: Match["stage"]; order: number[] }[] = [
  { title: "ラウンド32", stage: "round32", order: R32_ORDER },
  { title: "ラウンド16", stage: "round16", order: R16_ORDER },
  { title: "準々決勝", stage: "quarter", order: QF_ORDER },
  { title: "準決勝", stage: "semi", order: SF_ORDER },
];

function BracketColumn({
  title,
  matches,
  teamMap,
}: {
  title: string;
  matches: Match[];
  teamMap: Map<string, Team>;
}) {
  const pairs = pairUp(matches);
  return (
    <div className={styles.column}>
      <div className={styles.columnTitle}>{title}</div>
      <div className={styles.cards}>
        {pairs.map((pair, i) => (
          <div
            key={i}
            className={pair.length === 2 ? styles.pair : styles.pairSingle}
          >
            {pair.map((m) => (
              <BracketMatch key={m.id} match={m} teamMap={teamMap} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BracketView({ matches, teamMap }: Props) {
  const fin = matches.find(
    (m) => m.stage === "final" && matchNumber(m.id) === FINAL_NUM
  );
  const third = matches.find(
    (m) => m.stage === "third" && matchNumber(m.id) === THIRD_NUM
  );

  return (
    <div>
      <div className={styles.bracket}>
        {COLUMNS.map((col) => (
          <BracketColumn
            key={col.title}
            title={col.title}
            matches={pickByOrder(matches, col.stage, col.order)}
            teamMap={teamMap}
          />
        ))}

        <div className={styles.finalColumn}>
          <div className={styles.finalTitle}>決勝</div>
          {fin && <BracketMatch match={fin} teamMap={teamMap} />}
          {third && (
            <div className={styles.thirdWrap}>
              <div className={styles.thirdTitle}>3位決定戦</div>
              <BracketMatch match={third} teamMap={teamMap} />
            </div>
          )}
        </div>
      </div>

      <p className={styles.note}>
        ※ R16 以降の対戦カードは「73試合勝者」のようなラベル表記です。番号は各カード左上の{" "}
        <span className={styles.numChip}>#73</span> で照合できます。
      </p>
    </div>
  );
}
