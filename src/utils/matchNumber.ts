/** Extracts the FIFA match number from a match ID like "m073" → 73. */
export function matchNumber(matchId: string): number | null {
  const m = matchId.match(/^m0*(\d+)$/);
  return m ? Number(m[1]) : null;
}
