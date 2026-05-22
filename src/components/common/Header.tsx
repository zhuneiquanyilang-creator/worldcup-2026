import { Link } from "react-router-dom";
import { TeamSearch } from "./TeamSearch";
import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo}>FIFA</span>
          <span className={styles.title}>World Cup 2026</span>
        </Link>
        <TeamSearch />
        <span className={styles.host}>USA · Canada · Mexico</span>
      </div>
    </header>
  );
}
