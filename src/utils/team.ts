import type { Team } from "@/types/team";

/** Returns team's display string (flag + name) or the TBD label if team is unknown. */
export function teamDisplay(
  team: Team | undefined,
  label: string | undefined,
  fallbackId: string
): string {
  if (team) return `${team.flag} ${team.name}`;
  return label ?? fallbackId;
}
