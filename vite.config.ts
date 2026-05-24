import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import fs from "node:fs/promises";

const RESULTS_PATH = path.resolve(__dirname, "public/data/match_results.json");

/**
 * dev サーバー専用の書き込みエンドポイント。
 *   POST /__dev/match-results  body: {<matchId>: <LiveUpdate>, ...}
 *
 * ブラウザの localStorage で確定した結果を `public/data/match_results.json`
 * に書き戻すために使う。本番 (vite build した SPA) では存在しないので
 * クライアント側は失敗を許容してフォールバックする。
 *
 * 書き込みは "field-level merge" モード:
 *   1) 既存ファイルの試合と POST された試合の **両方** を残す
 *   2) 同じ試合 ID が両方にある場合は、フィールド単位で incoming が existing
 *      を上書き (= incoming に無いフィールド bookings / substitutions / etc.
 *      は existing から保持)
 *   これにより /edit/matches の限定的な save (status/score のみ等) が、
 *   既存の bookings/subs/formation 等を巻き込み消去しない。
 */
function matchResultsWriter(): Plugin {
  return {
    name: "match-results-writer",
    apply: "serve", // dev server only
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== "/__dev/match-results") return next();
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("method not allowed");
          return;
        }
        try {
          let body = "";
          for await (const chunk of req) body += chunk;
          const incoming = JSON.parse(body);
          if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
            res.statusCode = 400;
            res.end("body must be an object");
            return;
          }
          let existing: Record<string, unknown> = {};
          try {
            const raw = await fs.readFile(RESULTS_PATH, "utf8");
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
              existing = parsed as Record<string, unknown>;
          } catch {
            // ファイルが無いか壊れているなら空から始める
          }
          // field-level merge per match (cf. ヘッダコメント)
          const merged: Record<string, unknown> = { ...existing };
          for (const [id, val] of Object.entries(incoming)) {
            if (val && typeof val === "object" && !Array.isArray(val)) {
              const existingMatch = merged[id];
              if (
                existingMatch &&
                typeof existingMatch === "object" &&
                !Array.isArray(existingMatch)
              ) {
                merged[id] = {
                  ...(existingMatch as Record<string, unknown>),
                  ...(val as Record<string, unknown>),
                };
              } else {
                merged[id] = val;
              }
            } else {
              merged[id] = val;
            }
          }
          await fs.writeFile(
            RESULTS_PATH,
            JSON.stringify(merged, null, 2) + "\n",
            "utf8"
          );
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          res.end(JSON.stringify({ ok: true, count: Object.keys(merged).length }));
        } catch (e) {
          res.statusCode = 500;
          res.end(`error: ${e instanceof Error ? e.message : String(e)}`);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), matchResultsWriter()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    open: true,
    // LAN (同じ Wi-Fi 内) の他デバイスからアクセスできるよう 0.0.0.0 で待受
    host: true,
    proxy: {
      // Sofascore JSON API: ブラウザから直接叩くと CORS で弾かれるため
      // dev サーバー経由でリバースプロキシする。
      // 例: /sofascore-api/event/15186710
      //  → https://api.sofascore.com/api/v1/event/15186710
      "/sofascore-api": {
        target: "https://api.sofascore.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sofascore-api/, "/api/v1"),
        headers: {
          // 一部のプロキシ越しでブロックされないよう、ブラウザ風 UA を付与
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Referer: "https://www.sofascore.com/",
        },
      },
    },
  },
});
