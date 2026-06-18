import type { TeamDetail } from "@/types/teamDetail";
import styles from "./TeamProfile.module.css";

type Props = {
  detail: TeamDetail | undefined;
};

function valueOrDash(v: string | undefined | null): string {
  return v && v.length > 0 ? v : "—";
}

export function TeamProfile({ detail }: Props) {
  if (!detail) {
    return (
      <section className={styles.card}>
        <h2 className={styles.heading}>チーム詳細</h2>
        <p className={styles.empty}>このチームの詳細データは未登録です。</p>
      </section>
    );
  }

  const formatCoach = (c: { name: string; nationality: string }) =>
    `${c.name}${c.nationality ? `（${c.nationality}）` : ""}`;
  const coachValue = detail.coach
    ? detail.coach.previous
      ? `${formatCoach(detail.coach.previous)} → ${formatCoach(detail.coach)}`
      : formatCoach(detail.coach)
    : "—";

  const rows: { label: string; value: string }[] = [
    { label: "大陸", value: valueOrDash(detail.continent) },
    {
      label: "世界ランク",
      value: detail.worldRank ? `${detail.worldRank}位` : "—",
    },
    { label: "監督", value: coachValue },
    { label: "最高成績", value: valueOrDash(detail.bestResult) },
    {
      label: "出場回数",
      value:
        detail.appearanceCount > 0
          ? `${detail.appearanceCount}回（2026を含む）`
          : "—",
    },
    { label: "初出場", value: valueOrDash(detail.firstAppearance) },
    {
      label: "前回出場",
      value: detail.lastAppearance ? detail.lastAppearance : "なし（2026が初出場）",
    },
  ];

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>チーム詳細</h2>
      <dl className={styles.list}>
        {rows.map((r) => (
          <div key={r.label} className={styles.row}>
            <dt className={styles.label}>{r.label}</dt>
            <dd className={styles.value}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
