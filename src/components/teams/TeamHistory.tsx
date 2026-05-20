import type { PastResult } from "@/types/teamDetail";
import styles from "./TeamHistory.module.css";

type Props = {
  results: PastResult[];
};

export function TeamHistory({ results }: Props) {
  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>過去の成績</h2>
      {results.length === 0 ? (
        <p className={styles.empty}>データ準備中</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>年</th>
              <th>成績</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.year}>
                <td className={styles.year}>{r.year}</td>
                <td>{r.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
