import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { setLiveSource } from "./services/liveSource";
import { FootballDataLiveSource } from "./services/footballDataSource";
import { runJpNameMigration } from "./utils/jpNameMigration";
import "./styles/variables.css";
import "./styles/global.css";

// localStorage の JPN 選手名表記を空白入りに統一する一回限り migration。
// (JPN.json と match_results.json は既に統一済みだが localStorage が旧表記の
//  まま残ると useAutoSyncResults で毎回旧表記に上書きされてしまうため)
runJpNameMigration();

// ライブ更新ソースを Football-Data.org に設定。
//
//  - Sofascore: Cloudflare bot 対策で 2026 年 6 月時点 403 (sofascoreSource.ts に保持)
//  - API-Football: 無料プランは 2022-2024 シーズンのみ (apiFootballSource.ts に保持)
//  - Football-Data.org: 無料 (Tier One) で W 杯 2026 のスコア・順位・得点者取得可
//
// 取得できない情報 (フォーメーション・ゴール時系列・カード・交代) は /edit/matches
// や手動 script (例: scripts/write-m001-formations.mjs) で個別に入力する運用。
setLiveSource(new FootballDataLiveSource());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
