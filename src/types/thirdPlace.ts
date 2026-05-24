/**
 * `public/data/third_place_assignment.json` の型。
 * Wikipedia の「Template:2026 FIFAワールドカップ・3位組み合わせ表」を
 * `scripts/parse-third-place-table.mjs` で JSON 化したもの。
 */
export type ThirdPlaceAssignment = {
  _comment?: string;
  _source?: string;
  _fetchedAt?: string;
  /** "1A" → "m079" の R32 スロット ↔ 試合 ID マッピング */
  _slotToMatch: Record<string, string>;
  _key?: string;
  /**
   * 進出する 8 グループをアルファベット順に並べた 8 文字をキー (例 "DEFGHIJKL")。
   * 値は `{ matchId: groupLetter }` 形式で、その試合の 3 位スロットに入るグループを示す。
   */
  combinations: Record<string, Record<string, string>>;
};
