import { dayKey, formatDateJa } from "@/utils/date";
import styles from "./DateFilter.module.css";

type Props = {
  /** 全試合の日付 (ISO 8601) 一覧。重複・順序は問わない (内部でユニーク化・昇順ソート)。 */
  dates: string[];
  /** "all" または `dayKey` 形式 (YYYY-MM-DD) の試合日 */
  current: string | "all";
  onChange: (next: string | "all") => void;
};

export function DateFilter({ dates, current, onChange }: Props) {
  // 日付を dayKey (YYYY-MM-DD) でユニーク化 + 昇順ソート
  // 表示は最初に拾った ISO 文字列を使って formatDateJa で「2026/06/14 (日)」形式に
  const byKey = new Map<string, string>();
  for (const iso of dates) {
    const k = dayKey(iso);
    if (!byKey.has(k)) byKey.set(k, iso);
  }
  const items = [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <select
      className={styles.select}
      value={current}
      onChange={(e) => onChange(e.target.value as string | "all")}
    >
      <option value="all">すべて</option>
      {items.map(([key, iso]) => (
        <option key={key} value={key}>
          {formatDateJa(iso)}
        </option>
      ))}
    </select>
  );
}
