import styles from "./GroupFilter.module.css";

type Props = {
  groupIds: string[];
  current: string | "all";
  onChange: (g: string | "all") => void;
};

export function GroupFilter({ groupIds, current, onChange }: Props) {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={current === "all" ? `${styles.btn} ${styles.active}` : styles.btn}
        onClick={() => onChange("all")}
      >
        すべて
      </button>
      {groupIds.map((g) => (
        <button
          key={g}
          type="button"
          className={current === g ? `${styles.btn} ${styles.active}` : styles.btn}
          onClick={() => onChange(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
