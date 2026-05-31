/**
 * コラム記事の型。
 *
 * `body` は段落の配列。1要素 = 1段落として `<p>` に描画される。
 * 将来 Markdown を入れたくなったら body の型を `string` に変えて renderer を足す。
 */
/** 段落間に挿入する画像 (自由ライセンス画像の使用を前提)。 */
export type ColumnFigure = {
  /** 画像 URL (絶対 URL) */
  src: string;
  /** スクリーンリーダー用の代替テキスト */
  alt: string;
  /** 画像下のキャプション (任意) */
  caption?: string;
  /** 帰属表記。例 "Ank Kumar / Wikimedia Commons / CC BY-SA 4.0" */
  credit: string;
  /** ライセンス本文 URL (任意。クリック可能にする) */
  licenseUrl?: string;
  /** 元ファイルの出典ページ URL (任意。例 commons.wikimedia.org の File: ページ) */
  sourceUrl?: string;
  /** body のこの段落 index の「後」に挿入する (0 = 最初の段落の後)。
   *  指定なしは末尾。 */
  after?: number;
  /** 表示サイズ。指定なし = 本文幅いっぱい (lg 相当)。
   *  xs ≒ 160px / sm ≒ 280px / md ≒ 480px / lg ≒ 100%
   *  同じ `after` を持つ figure が 2 枚以上ある場合は自動で横並びになるので、
   *  4 枚一列にしたいときは xs 推奨。 */
  size?: "xs" | "sm" | "md" | "lg";
};

export type Column = {
  id: string;
  title: string;
  /** ISO 8601 date (YYYY-MM-DD)。一覧では新しい順に並ぶ */
  date: string;
  /** 一覧カードに出す短い要約 */
  summary: string;
  /** 段落の配列 (詳細ページで表示) */
  body: string[];
  /** 筆者名 (任意) */
  author?: string;
  /** タグ・トピックの任意配列。一覧で小さなチップとして表示 */
  tags?: string[];
  /** 段落間に挟む画像 (任意)。after 指定で挿入位置を制御 */
  figures?: ColumnFigure[];
};
