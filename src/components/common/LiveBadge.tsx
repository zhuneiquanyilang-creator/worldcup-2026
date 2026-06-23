import styles from "./LiveBadge.module.css";

type Props = {
  /** 表示テキスト。例 "LIVE" / "45+2'" / "HT" / "中断中" */
  label?: string;
  /** "live" = 赤 + 点滅 (デフォルト) / "suspended" = アンバー、中断中の表示用 */
  variant?: "live" | "suspended";
  className?: string;
};

/** 試合がライブ中・中断中であることを示すバッジ。 */
export function LiveBadge({ label = "LIVE", variant = "live", className }: Props) {
  const base =
    variant === "suspended"
      ? `${styles.badge} ${styles.badgeSuspended}`
      : styles.badge;
  return (
    <span className={className ? `${base} ${className}` : base}>
      <span
        className={
          variant === "suspended"
            ? `${styles.dot} ${styles.dotSuspended}`
            : styles.dot
        }
        aria-hidden
      />
      {label}
    </span>
  );
}
