import styles from "./LiveBadge.module.css";

type Props = {
  /** 表示テキスト。例 "LIVE" / "45+2'" / "HT" */
  label?: string;
  className?: string;
};

/** 試合がライブ中であることを示す赤い点滅バッジ。 */
export function LiveBadge({ label = "LIVE", className }: Props) {
  return (
    <span className={className ? `${styles.badge} ${className}` : styles.badge}>
      <span className={styles.dot} aria-hidden />
      {label}
    </span>
  );
}
