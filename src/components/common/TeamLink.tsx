import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { Team } from "@/types/team";
import { Flag } from "./Flag";
import styles from "./TeamLink.module.css";

type Props = {
  team: Team | undefined;
  /** TBD ラベル（teamが未確定の場合に表示） */
  label?: string;
  /** チーム ID（teamも label もなければ表示） */
  fallbackId: string;
  className?: string;
  /** 国旗の高さ (px) */
  flagSize?: number;
};

/**
 * チーム名のクリッカブル表示。
 * team が存在すれば /teams/:id へのリンクを返す。
 * 未確定 (TBD) の場合はリンクなしで label を表示。
 * 親要素が onClick を持つ場合に備えて stopPropagation を行う。
 */
export function TeamLink({ team, label, fallbackId, className, flagSize = 18 }: Props) {
  const stop = (e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation();

  if (team) {
    return (
      <Link
        to={`/teams/${team.id}`}
        className={className ? `${styles.link} ${className}` : styles.link}
        onClick={stop}
      >
        <Flag isoCode={team.isoCode} size={flagSize} alt={team.name} />
        <span>{team.name}</span>
      </Link>
    );
  }
  return <span className={className}>{label ?? fallbackId}</span>;
}
