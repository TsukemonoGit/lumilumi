import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { svelteTesting } from "@testing-library/svelte/vite";
export default defineConfig({
  server: {
    host: true,
    headers: {
      "Content-Security-Policy":
        "worker-src 'self' http://localhost:5173; script-src 'self';",
    },
  },
  plugins: [
    svelteTesting(),
    sveltekit(),
    SvelteKitPWA({
      // サービスワーカーの戦略を指定
      strategies: "injectManifest", // ここでサービスワーカーを生成する設定
      srcDir: "./src",
      filename: "my-sw.ts", // 自作のサービスワーカーのファイル名を指定

      // サービスワーカーの登録に関連する設定
      injectRegister: "auto", // サービスワーカーを自動的にインジェクト
      registerType: "autoUpdate", // サービスワーカーが更新されるたびに自動で更新
      injectManifest: {
        injectionPoint: undefined,
        rollupFormat: "iife",
      },
      // 開発オプション（開発環境でもPWAを確認するための設定）
      devOptions: {
        enabled: true, // 開発時でもPWAが有効
      },

      pwaAssets: {
        config: true,
      },
      manifest: {
        short_name: "lumilumi",
        name: "lumilumi",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#000000",
        //Web Share Target API//共有ボタン押したときに一覧に表示されるようにする
        //https://developer.mozilla.org/ja/docs/Web/Manifest/share_target
        share_target: {
          action: "/post",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url",
            files: [
              {
                name: "media",
                accept: ["image/*", "video/*", "audio/*"],
              },
            ],
          },
        },
      },

      workbox: {
        globPatterns: [
          "client/**/*.{js,css,ico,png,svg,webp,webmanifest}",
          "prerendered/**/*.html",
        ],
      }, //https://vite-pwa-org.netlify.app/guide/service-worker-precache.html#precache-manifest
    }),
  ],
});
