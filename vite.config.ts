import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
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
