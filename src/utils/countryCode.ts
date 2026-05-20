import type { Team } from "@/types/team";

/**
 * 表示用の2文字アルファベットコードを返す。
 * 通常はISO 3166-1 alpha-2 を大文字化したもの。
 * gb-eng / gb-sct のような構成国コードは末尾2文字を取る (EN / SC)。
 */
export function shortCode(team: Team | undefined): string {
  if (!team) return "";
  const iso = team.isoCode;
  if (iso.includes("-")) {
    return iso.split("-")[1].slice(0, 2).toUpperCase();
  }
  return iso.slice(0, 2).toUpperCase();
}
