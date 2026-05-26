/**
 * 試合カード等に並べる日本国内放送局バッジ。
 * FIFA 公式 (canadamexicousa2026/scores-fixtures?country=JP) の表示に合わせている。
 *
 * 実装方針: 各局の公式ロゴは商標なので複製せず、ブランドカラー + テキストで識別できる
 * 情報用バッジを CSS で組む。"NHK G" や "BS4K" は番組欄での識別用呼称 (固有名詞) であり
 * テキスト表記そのものは情報利用として通常許容される。
 */
import styles from "./BroadcasterBadge.module.css";

export type BroadcasterCode =
  | "nhk-g"
  | "nhk-bs1"
  | "nhk-bs4k"
  | "ntv"
  | "fuji"
  | "dazn";

type Props = { code: string };

type Meta = { label: string; full: string; className: string };

const META: Record<BroadcasterCode, Meta> = {
  "nhk-g": { label: "G", full: "NHK 総合", className: styles.nhkG },
  "nhk-bs1": { label: "BS1", full: "NHK BS1", className: styles.nhkBs1 },
  "nhk-bs4k": { label: "BS4K", full: "NHK BS4K", className: styles.nhkBs4k },
  ntv: { label: "日テレ", full: "日本テレビ", className: styles.ntv },
  fuji: { label: "フジ", full: "フジテレビ", className: styles.fuji },
  dazn: { label: "DAZN", full: "DAZN (配信)", className: styles.dazn },
};

export function BroadcasterBadge({ code }: Props) {
  const meta = META[code as BroadcasterCode];
  if (!meta) return null;
  return (
    <span className={`${styles.badge} ${meta.className}`} title={meta.full}>
      {meta.label}
    </span>
  );
}

export function BroadcasterList({ codes }: { codes?: string[] }) {
  if (!codes || codes.length === 0) return null;
  return (
    <span className={styles.list} aria-label="放送局">
      {codes.map((c) => (
        <BroadcasterBadge key={c} code={c} />
      ))}
    </span>
  );
}
