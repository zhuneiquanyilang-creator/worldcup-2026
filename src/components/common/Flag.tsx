import styles from "./Flag.module.css";

type Props = {
  /** ISO 3166-1 alpha-2 コード (例: "jp")。"gb-eng" 等のサブディビジョンも可 */
  isoCode: string;
  /** 表示高さ (px)。幅は元画像のアスペクト比に従う */
  size?: number;
  /** 代替テキスト */
  alt?: string;
  className?: string;
};

/**
 * 国旗 SVG (flagcdn.com)。Windows でも確実に旗が表示される。
 */
export function Flag({ isoCode, size = 18, alt, className }: Props) {
  const url = `https://flagcdn.com/${isoCode.toLowerCase()}.svg`;
  return (
    <img
      src={url}
      alt={alt ?? isoCode}
      height={size}
      loading="lazy"
      className={className ? `${styles.flag} ${className}` : styles.flag}
    />
  );
}
