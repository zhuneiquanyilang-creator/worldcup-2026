export type Position = "GK" | "DF" | "MF" | "FW";

export type Player = {
  id: string;
  name: string;
  teamId: string;
  position: Position;
  goals: number;
  assists: number;
  /** 背番号 (代表チームでの公式番号)。Sofascore の shirtNumber と突合して得点者を特定 */
  number?: number;
  /** ISO 8601 date (YYYY-MM-DD) */
  birthDate?: string;
  /** 所属クラブ名 */
  club?: string;
};
