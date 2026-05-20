import type { Match } from "@/types/match";
import type { Player } from "@/types/player";

export type PlayerStats = {
  goals: number;
  assists: number;
};

/**
 * 試合結果から選手別の得点・アシスト数を集計する。
 *
 * 突合ルール:
 * - `playerId` が `players.json` に存在すればそれを使う
 * - 無ければ `playerName` の完全一致で `players.json` を検索
 * - どちらも該当しない場合はカウントしない（その得点はチーム集計のみ）
 * - 自殺点 (`type === "own"`) は得点者にカウントしない（アシストは元々付かない）
 */
export function computePlayerStats(
  players: Player[],
  matches: Match[]
): Map<string, PlayerStats> {
  const stats = new Map<string, PlayerStats>();
  for (const p of players) {
    stats.set(p.id, { goals: 0, assists: 0 });
  }

  const nameToId = new Map<string, string>();
  for (const p of players) {
    nameToId.set(p.name, p.id);
  }

  const resolve = (id: string | undefined, name: string | undefined): string | undefined => {
    if (id && stats.has(id)) return id;
    if (name) {
      const found = nameToId.get(name);
      if (found) return found;
    }
    return undefined;
  };

  for (const m of matches) {
    if (m.status !== "finished" || !m.goals) continue;
    for (const g of m.goals) {
      if (g.type !== "own") {
        const scorerId = resolve(g.playerId, g.playerName);
        if (scorerId) stats.get(scorerId)!.goals++;
      }
      const assistId = resolve(g.assistPlayerId, g.assistPlayerName);
      if (assistId) stats.get(assistId)!.assists++;
    }
  }

  return stats;
}
