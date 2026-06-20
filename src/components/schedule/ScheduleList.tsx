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
    // ISO 8601 文字列はタイムゾーン違いで localeCompare が UTC 順にならない
    // (例: "T20:00-07:00" は文字列上 "T20:30-04:00" より前だが実時刻は後)。
    // 必ず UTC ミリ秒に変換してから比較する。
    const sorted = [...matches].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
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
