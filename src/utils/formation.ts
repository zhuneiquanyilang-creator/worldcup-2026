import type { FormationData, FormationSpot } from "@/types/match";

export type RawPlayer = {
  number?: number;
  name: string;
  /** Sofascore 由来の大分類: "G" / "D" / "M" / "F"。生成のヒント用 */
  category?: string;
};

/**
 * フォーメーション文字列 (例: "4-3-3", "4-2-3-1", "3-5-2") と
 * 先発11名 (GK→守備→攻撃 の順を想定) から SVG ピッチ用の x/y 座標を生成する。
 *
 * 想定する Sofascore の配列順:
 *   players[0] = GK
 *   players[1..count[0]] = 第1層 (DF)
 *   players[count[0]+1..] = 以降の層 (中盤→前線へ)
 *
 * x: 0=自陣GK / 100=相手ゴール方向
 * y: 0=左サイド / 100=右サイド
 */
export function generateFormation(
  formationStr: string,
  players: RawPlayer[],
  bench?: { number?: number; name: string }[]
): FormationData {
  const parts = formationStr
    .split("-")
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  const spots: FormationSpot[] = [];

  // GK
  if (players[0]) {
    spots.push({
      x: 8,
      y: 50,
      number: players[0].number,
      name: players[0].name,
      role: "GK",
    });
  }

  // 各層を 28%〜80% の範囲で等間隔に並べる。
  // X_MIN=22 だと GK (x=8) と最終ラインのラベルが横方向に被ることがあるので、
  // 最終ラインを少しだけ内側 (= ホームなら右、アウェイなら左) にずらす。
  const X_MIN = 28;
  const X_MAX = 80;
  const layerCount = parts.length;
  let cursor = 1;

  parts.forEach((count, layerIdx) => {
    const x =
      layerCount === 1
        ? (X_MIN + X_MAX) / 2
        : X_MIN + (layerIdx / (layerCount - 1)) * (X_MAX - X_MIN);

    for (let i = 0; i < count; i++) {
      const p = players[cursor];
      cursor++;
      if (!p) continue;
      const y = ((i + 0.5) / count) * 100;
      spots.push({
        x,
        y,
        number: p.number,
        name: p.name,
        role: layerRoleHint(layerIdx, layerCount, p.category),
      });
    }
  });

  return {
    shape: formationStr,
    starting: spots,
    bench: bench && bench.length > 0 ? bench : undefined,
  };
}

function layerRoleHint(
  layerIdx: number,
  totalLayers: number,
  category?: string
): string | undefined {
  if (category === "G") return "GK";
  if (totalLayers <= 1) return category;
  if (layerIdx === 0) return "DF";
  if (layerIdx === totalLayers - 1) return "FW";
  return "MF";
}
