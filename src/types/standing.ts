export type Standing = {
  teamId: string;
  groupId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** FIFA フェアプレーポイント (タイブレーカー #7)。負の値が悪い。
   *  Y=-1 / Y2R=-3 / R=-4 / YR=-5 で `match.bookings` から集計。
   *  Y2R / YR は「2枚目イエロー退場」「イエロー後の一発レッド退場」を
   *  単独イベントとして記録する想定 (preceding Y を別エントリで含めない)。 */
  fairPlayPoints: number;
};
