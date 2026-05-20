import type { MatchStage } from "@/types/match";
import { stageLabel } from "@/utils/stage";
import styles from "./StageFilter.module.css";

type Props = {
  stages: MatchStage[];
  current: MatchStage | "all";
  onChange: (s: MatchStage | "all") => void;
};

export function StageFilter({ stages, current, onChange }: Props) {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={current === "all" ? `${styles.btn} ${styles.active}` : styles.btn}
        onClick={() => onChange("all")}
      >
        すべて
      </button>
      {stages.map((s) => (
        <button
          key={s}
          type="button"
          className={current === s ? `${styles.btn} ${styles.active}` : styles.btn}
          onClick={() => onChange(s)}
        >
          {stageLabel(s)}
        </button>
      ))}
    </div>
  );
}
