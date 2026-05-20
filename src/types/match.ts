export type MatchStage =
  | "test"
  | "group"
  | "round32"
  | "round16"
  | "quarter"
  | "semi"
  | "third"
  | "final";

export type MatchStatus = "scheduled" | "live" | "finished";

export type GoalType = "normal" | "penalty" | "own";

export type Goal = {
  minute: number;
  teamId: string;
  /** players.json の選手 ID */
  playerId?: string;
  /** 表示名（playerId が無い場合のフォールバック） */
  playerName?: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  type: GoalType;
};

/** Y=イエロー / Y2R=2枚目イエロー退場 / R=一発レッド / YR=イエロー後の一発レッド */
export type BookingType = "Y" | "Y2R" | "R" | "YR";

export type Booking = {
  minute: number;
  teamId: string;
  playerName: string;
  type: BookingType;
};

export type Substitution = {
  minute: number;
  teamId: string;
  inName: string;
  outName: string;
};

export type FormationSpot = {
  /** ピッチ縦軸 (0-100): 0=自陣GK側, 100=攻撃方向 */
  x: number;
  /** ピッチ横軸 (0-100): 0=左, 100=右 */
  y: number;
  number?: number;
  name: string;
  /** 役割表記 (例: "GK", "CB", "CM") */
  role?: string;
};

export type FormationData = {
  /** "4-3-3" 等 */
  shape: string;
  starting: FormationSpot[];
  bench?: { number?: number; name: string }[];
};

export type MatchStats = {
  /** ボール支配率 (0-100, %) */
  possession?: { home: number; away: number };
  /** ゴール期待値 (xG) */
  xG?: { home: number; away: number };
  /** シュート総数 */
  shots?: { home: number; away: number };
  /** 枠内シュート数 */
  shotsOnTarget?: { home: number; away: number };
};

export type Match = {
  id: string;
  stage: MatchStage;
  groupId?: string;
  date: string;
  venue: string;
  homeTeamId: string;
  awayTeamId: string;
  /** Used when the team has not been determined yet (e.g. knockout stage). */
  homeTeamLabel?: string;
  awayTeamLabel?: string;
  status: MatchStatus;
  /** Sofascore など外部ソース由来の進行ラベル (例: "1st half" / "Halftime" / "Full time") */
  liveLabel?: string;
  score?: { home: number; away: number };
  goals?: Goal[];
  bookings?: Booking[];
  substitutions?: Substitution[];
  homeFormation?: FormationData;
  awayFormation?: FormationData;
  stats?: MatchStats;
  lineup?: { home: string[]; away: string[] };
};
