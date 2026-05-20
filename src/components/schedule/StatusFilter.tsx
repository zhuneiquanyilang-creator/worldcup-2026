import type { MatchStatus } from "@/types/match";
import styles from "./StatusFilter.module.css";

type Option = { value: MatchStatus | "all"; label: string };

const options: Option[] = [
  { value: "all", label: "すべて" },
  { value: "scheduled", label: "予定" },
  { value: "live", label: "ライブ" },
  { value: "finished", label: "終了" },
];

type Props = {
  current: MatchStatus | "all";
  onChange: (s: MatchStatus | "all") => void;
};

export function StatusFilter({ current, onChange }: Props) {
  return (
    <div className={styles.bar}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={current === o.value ? `${styles.btn} ${styles.active}` : styles.btn}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
