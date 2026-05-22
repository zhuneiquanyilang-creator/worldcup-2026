import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams } from "@/hooks/useTeams";
import type { Team } from "@/types/team";
import { Flag } from "./Flag";
import styles from "./TeamSearch.module.css";

const MAX_RESULTS = 8;

/** クエリがチーム名（日本語）・英語名・FIFAコードのいずれかに部分一致するか */
function isMatch(team: Team, query: string): boolean {
  const lower = query.toLowerCase();
  return (
    team.name.includes(query) ||
    team.nameEn.toLowerCase().includes(lower) ||
    team.id.toLowerCase().includes(lower)
  );
}

/**
 * ヘッダーに置く国名検索ボックス。
 * 入力に一致した国を候補表示し、選択すると /teams/:id（チーム詳細）へ遷移する。
 */
export function TeamSearch() {
  const teamsRes = useTeams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const teams = teamsRes.status === "ready" ? teamsRes.data : [];

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return teams.filter((t) => isMatch(t, q)).slice(0, MAX_RESULTS);
  }, [teams, query]);

  // 検索ボックスの外側クリックで候補を閉じる
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const showList = open && results.length > 0;

  const select = (team: Team) => {
    navigate(`/teams/${team.id}`);
    setQuery("");
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" && showList) {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp" && showList) {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && showList) {
      e.preventDefault();
      const team = results[activeIndex] ?? results[0];
      if (team) select(team);
    }
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        type="search"
        className={styles.input}
        placeholder="国名で検索（例: 日本 / Japan）"
        value={query}
        autoComplete="off"
        aria-label="国名検索"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className={styles.list}>
          {results.map((team, i) => (
            <li key={team.id}>
              <button
                type="button"
                className={
                  i === activeIndex ? `${styles.item} ${styles.active}` : styles.item
                }
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => select(team)}
              >
                <Flag isoCode={team.isoCode} size={20} alt={team.name} />
                <span className={styles.name}>{team.name}</span>
                <span className={styles.sub}>{team.nameEn}</span>
                <span className={styles.group}>{team.groupId}組</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() !== "" && results.length === 0 && (
        <div className={styles.empty}>該当する国がありません</div>
      )}
    </div>
  );
}
