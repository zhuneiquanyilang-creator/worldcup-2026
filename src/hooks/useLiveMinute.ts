import { useEffect, useState } from "react";
import type { Match } from "@/types/match";
import { liveMinuteLabel } from "@/utils/matchTiming";

/**
 * ライブ中の経過分ラベル ("23'" / "HT" 等) を返すフック。
 * 試合が live の場合のみ 1 秒毎に再計算する。
 * 非ライブのときは空文字を返し、タイマーも動かない。
 */
export function useLiveMinute(match: Match): string {
  const [label, setLabel] = useState(() => liveMinuteLabel(match));

  useEffect(() => {
    if (match.status !== "live") {
      setLabel("");
      return;
    }
    setLabel(liveMinuteLabel(match));
    const id = window.setInterval(() => {
      setLabel(liveMinuteLabel(match));
    }, 1000);
    return () => window.clearInterval(id);
  }, [match]);

  return label;
}
