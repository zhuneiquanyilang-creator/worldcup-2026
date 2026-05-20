import type { MatchStage } from "@/types/match";

const labels: Record<MatchStage, string> = {
  test: "テストマッチ",
  group: "グループステージ",
  round32: "ラウンド32",
  round16: "ラウンド16",
  quarter: "準々決勝",
  semi: "準決勝",
  third: "3位決定戦",
  final: "決勝",
};

export function stageLabel(stage: MatchStage, groupId?: string): string {
  if (stage === "group" && groupId) return `グループ ${groupId}`;
  return labels[stage];
}
