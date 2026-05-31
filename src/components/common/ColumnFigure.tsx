/**
 * コラム本文中に挿入する画像 + 帰属表記ブロック。
 *
 * 著作権配慮: 公開サイトに掲載する画像は自由ライセンス (CC0 / CC BY / CC BY-SA /
 * Public Domain など) のみを想定。`credit` と `licenseUrl` を必ず表示するため、
 * CC BY 系の attribution 要件はこのコンポーネントを通して自動的に満たされる。
 */
import type { ColumnFigure as Figure } from "@/types/column";
import styles from "./ColumnFigure.module.css";

type Props = { figure: Figure };

const SIZE_CLASS = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
} as const;

export function ColumnFigure({ figure }: Props) {
  const sizeClass = figure.size ? SIZE_CLASS[figure.size] : "";
  return (
    <figure className={`${styles.figure} ${sizeClass}`}>
      <img
        src={figure.src}
        alt={figure.alt}
        loading="lazy"
        className={styles.image}
      />
      {figure.caption && (
        <figcaption className={styles.caption}>{figure.caption}</figcaption>
      )}
      <p className={styles.credit}>
        {figure.sourceUrl ? (
          <a href={figure.sourceUrl} target="_blank" rel="noreferrer noopener">
            出典
          </a>
        ) : (
          "出典"
        )}
        :{" "}
        {figure.licenseUrl ? (
          <a href={figure.licenseUrl} target="_blank" rel="noreferrer noopener">
            {figure.credit}
          </a>
        ) : (
          figure.credit
        )}
      </p>
    </figure>
  );
}
