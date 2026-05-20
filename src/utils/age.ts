/** 2026年W杯開幕日。年齢の基準として使用（観覧時点に関わらず安定した値にする）。 */
export const REFERENCE_DATE = new Date("2026-06-11T00:00:00Z");

/**
 * 生年月日（YYYY-MM-DD）から、基準日時点での満年齢を返す。
 * 不正・空文字なら null。
 */
export function calculateAge(birthDate: string | undefined, refDate: Date = REFERENCE_DATE): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  let age = refDate.getUTCFullYear() - birth.getUTCFullYear();
  const m = refDate.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && refDate.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  return age;
}
