import styles from "./GroupTabs.module.css";

type Props = {
  groupIds: string[];
  current: string;
  onChange: (id: string) => void;
};

export function GroupTabs({ groupIds, current, onChange }: Props) {
  return (
    <div className={styles.tabs}>
      {groupIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={id === current ? `${styles.tab} ${styles.active}` : styles.tab}
        >
          グループ {id}
        </button>
      ))}
    </div>
  );
}
