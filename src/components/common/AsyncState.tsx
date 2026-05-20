import styles from "./AsyncState.module.css";

export function Loading({ label = "読み込み中..." }: { label?: string }) {
  return <div className={styles.loading}>{label}</div>;
}

export function ErrorMessage({ message }: { message: string }) {
  return <div className={styles.error}>エラー: {message}</div>;
}
