import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import { dataUrl } from "@/utils/dataUrl";
import styles from "./PastTournamentsPage.module.css";

type Host = {
  edition: number;
  year: number;
  hosts: string[];
};

export function PastTournamentsPage() {
  const [data, setData] = useState<Host[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(dataUrl("world_cup_hosts.json"))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Host[]>;
      })
      .then((arr) => {
        const past = arr.filter((h) => h.year <= 2022).sort((a, b) => b.year - a.year);
        setData(past);
      })
      .catch((e) => setError(String(e)));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!data) return <Loading />;

  return (
    <div>
      <h1>過去の大会</h1>
      <ul className={styles.list}>
        {data.map((h) => (
          <li key={h.year}>
            <Link to={`/past/${h.year}`} className={styles.item}>
              <span className={styles.year}>{h.year}</span>
              <span className={styles.edition}>第{h.edition}回</span>
              <span className={styles.hosts}>{h.hosts.join(" / ")}</span>
              <span className={styles.chevron} aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
