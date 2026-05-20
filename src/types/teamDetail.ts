export type PastResult = {
  year: number;
  result: string;
};

export type Coach = {
  name: string;
  /** 国籍。不明は "" */
  nationality: string;
};

export type TeamDetail = {
  teamId: string;
  /** 大陸連盟（例: "ヨーロッパ (UEFA)"） */
  continent: string;
  /** 最高成績（例: "ベスト4 (2002)"）。不明は "" */
  bestResult: string;
  /** 初出場年（例: "1998"）。不明は "" */
  firstAppearance: string;
  /** 前回出場年（2026以前で最後に出場した年）。なしは "" */
  lastAppearance: string;
  /** 出場回数（2026 を含む通算）。0 は今回が初 */
  appearanceCount: number;
  /** 年ごとの成績。空配列でも可 */
  pastResults: PastResult[];
  /** 監督。未登録は省略可 */
  coach?: Coach;
  /** FIFA 世界ランキング順位（2026/4/1 時点）。未登録は省略 */
  worldRank?: number;
};
