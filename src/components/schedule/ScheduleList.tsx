import { useMemo } from "react";
import type { Match } from "@/types/match";
import type { Team } from "@/types/team";
import { dayKey } from "@/utils/date";
import { ScheduleDayGroup } from "./ScheduleDayGroup";

type Props = {
  matches: Match[];
  teamMap: Map<string, Team>;
};

export function ScheduleList({ matches, teamMap }: Props) {
  const grouped = useMemo(() => {
    const sorted = [...matches].sort((a, b) => a.date.localeCompare(b.date));
    const buckets = new Map<string, Match[]>();
    for (const m of sorted) {
      const k = dayKey(m.date);
      const arr = buckets.get(k) ?? [];
      arr.push(m);
      buckets.set(k, arr);
    }
    return Array.from(buckets.entries());
  }, [matches]);

  return (
    <div>
      {grouped.map(([day, dayMatches]) => (
        <ScheduleDayGroup
          key={day}
          isoDate={dayMatches[0].date}
          matches={dayMatches}
          teamMap={teamMap}
        />
      ))}
    </div>
  );
}
