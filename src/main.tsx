import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { setLiveSource } from "./services/liveSource";
import { SofascoreLiveSource } from "./services/sofascoreSource";
import "./styles/variables.css";
import "./styles/global.css";

// ライブ更新ソースを Sofascore に差し替え
// (CORS 制約のため、dev サーバーは vite.config.ts のプロキシ経由で API を叩く)
setLiveSource(new SofascoreLiveSource());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
