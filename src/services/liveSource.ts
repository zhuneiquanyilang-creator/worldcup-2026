import type { Match } from "@/types/match";
import type { LiveUpdate } from "@/types/live";

/**
 * 外部のライブ情報源を抽象化するインターフェース。
 *
 * 実装は後でサイトが決まってから差し替え。現在は MockLiveSource（常に null を返す）。
 * 将来的にサイトが決まったら HTML パース or JSON API クライアントを実装してここに差し込む。
 */
export interface LiveSource {
  /** 指定試合の最新情報を取得。更新が無い／取得できなかった場合は null。 */
  fetchUpdate(match: Match): Promise<LiveUpdate | null>;
}

/** 何もしないモック。サイト決定前のプレースホルダ。 */
export class MockLiveSource implements LiveSource {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetchUpdate(_match: Match): Promise<LiveUpdate | null> {
    return null;
  }
}

/** プロジェクト全体で使う唯一のソースインスタンス。差し替えはここで。 */
let currentSource: LiveSource = new MockLiveSource();

export function getLiveSource(): LiveSource {
  return currentSource;
}

export function setLiveSource(source: LiveSource) {
  currentSource = source;
}
