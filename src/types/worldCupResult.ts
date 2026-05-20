export type Award = {
  /** 選手名 */
  player: string;
  /** 国籍 (手入力) */
  nationality: string;
};

/** 1大会分の最終結果と各賞。すべて空文字許容 (未入力)。 */
export type WorldCupResult = {
  year: number;
  /** 1位 (優勝国) */
  first: string;
  /** 2位 (準優勝国) */
  second: string;
  /** 3位 */
  third: string;
  /** 4位 */
  fourth: string;
  /** 最優秀選手 (ゴールデンボール) */
  goldenBall: Award;
  /** シルバーボール */
  silverBall: Award;
  /** ブロンズボール */
  bronzeBall: Award;
  /** 得点王 (ゴールデンブーツ) */
  goldenBoot: Award;
  /** 最優秀GK (ゴールデングローブ) */
  goldenGlove: Award;
  /** 最優秀若手選手 (ベストヤングプレーヤー) */
  bestYoungPlayer: Award;
  /** ベストゴール */
  bestGoal: Award;
};

export type KnockoutRound = "round16" | "quarter" | "semi" | "third" | "final";

/** 決勝トーナメント1試合分。score は通常 (または延長) のスコア。PK 決着は note に記載。 */
export type KnockoutMatch = {
  round: KnockoutRound;
  team1: string;
  score1: number;
  team2: string;
  score2: number;
  /** 勝者 (1 = team1, 2 = team2)。延長・PK・再試合の最終的な勝ち上がり側。 */
  winner: 1 | 2;
  /** "延長" / "PK 4-2" / "再試合" 等の補足 */
  note?: string;
};

export type WorldCupKnockout = {
  year: number;
  matches: KnockoutMatch[];
};

export function emptyAward(): Award {
  return { player: "", nationality: "" };
}

export function emptyResult(year: number): WorldCupResult {
  return {
    year,
    first: "",
    second: "",
    third: "",
    fourth: "",
    goldenBall: emptyAward(),
    silverBall: emptyAward(),
    bronzeBall: emptyAward(),
    goldenBoot: emptyAward(),
    goldenGlove: emptyAward(),
    bestYoungPlayer: emptyAward(),
    bestGoal: emptyAward(),
  };
}
