import { useMemo, useState } from "react";
import { useMatches } from "@/hooks/useMatches";
import { useTeams, useTeamMap } from "@/hooks/useTeams";
import { GroupTabs } from "@/components/standings/GroupTabs";
import { StandingsTable } from "@/components/standings/StandingsTable";
import { ThirdPlaceRanking } from "@/components/standings/ThirdPlaceRanking";
import { Loading, ErrorMessage } from "@/components/common/AsyncState";
import { computeStandings } from "@/utils/computeStandings";

export function StandingsPage() {
  const teamsRes = useTeams();
  const teamMapRes = useTeamMap();
  const matchesRes = useMatches();
  const [currentGroup, setCurrentGroup] = useState<string>("A");

  const standings = useMemo(() => {
    if (teamsRes.status !== "ready" || matchesRes.status !== "ready") return [];
    return computeStandings(teamsRes.data, matchesRes.data);
  }, [teamsRes, matchesRes]);

  const groupIds = useMemo(() => {
    return Array.from(new Set(standings.map((s) => s.groupId))).sort();
  }, [standings]);

  if (
    teamsRes.status === "loading" ||
    teamMapRes.status === "loading" ||
    matchesRes.status === "loading"
  ) {
    return <Loading />;
  }
  if (teamsRes.status === "error") return <ErrorMessage message={teamsRes.error} />;
  if (teamMapRes.status === "error") return <ErrorMessage message={teamMapRes.error} />;
  if (matchesRes.status === "error") return <ErrorMessage message={matchesRes.error} />;

  const groupStandings = standings.filter((s) => s.groupId === currentGroup);

  return (
    <div>
      <h1>順位表</h1>
      <GroupTabs groupIds={groupIds} current={currentGroup} onChange={setCurrentGroup} />
      <StandingsTable
        standings={groupStandings}
        teamMap={teamMapRes.map}
        matches={matchesRes.data}
      />
      <ThirdPlaceRanking
        standings={standings}
        teamMap={teamMapRes.map}
        matches={matchesRes.data}
      />
    </div>
  );
}
