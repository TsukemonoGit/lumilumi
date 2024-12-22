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

      injectManifest: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
      },
      workbox: {
        globPatterns: ["client/**/*.{js,css,ico,png,svg,webp,woff,woff2}"],
      }, //https://vite-pwa-org.netlify.app/guide/service-worker-precache.html#precache-manifest
      devOptions: {
        enabled: true,
        suppressWarnings: process.env.SUPPRESS_WARNING === "true",
        type: "module",
        navigateFallback: "/",
      },
      // if you have shared info in svelte config file put in a separate module and use it also here
      kit: {
        includeVersionFile: true,
      },
    }),
  ],
});
