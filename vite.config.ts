import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { svelteTesting } from "@testing-library/svelte/vite";

export default defineConfig({
  server: {
    host: true,
    headers: {
      "Content-Security-Policy": "worker-src 'self'; script-src 'self';",
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
      scope: "/",
      // サービスワーカーの登録に関連する設定
      injectRegister: "auto", // サービスワーカーを自動的にインジェクト
      registerType: "prompt", //"prompt", // サービスワーカーが更新されるたびに自動で更新,

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

        //https://developer.chrome.com/docs/web-platform/best-practices/url-protocol-handler?hl=ja
        //https://developer.mozilla.org/en-US/docs/Web/Manifest/protocol_handlers
        protocol_handlers: [
          {
            protocol: "nostr",
            url: "/%s",
          },
          {
            protocol: "web+nostr",
            url: "/%s",
          },
        ],
      },
      //https://vite-pwa-org.netlify.app/frameworks/sveltekit.html#globpatterns
      injectManifest: {
        globPatterns: [
          "client/**/*.{js,css,ico,png,svg,webp,webmanifest}",
          "prerendered/**/*.{html,json}",
        ],
        globIgnores: ["node_modules/**/*"],
        // ↓ここでリビジョン情報を有効にする
        // manifestTransforms: [
        //   async (entries) => {
        //     return {
        //       manifest: entries.map((entry) => ({
        //         ...entry,
        //         revision: crypto
        //           .createHash("md5")
        //           .update(entry.url)
        //           .digest("hex"),
        //       })),
        //     };
        //   },
        // ],
      },

      devOptions: {
        enabled: true,
        suppressWarnings: process.env.SUPPRESS_WARNING === "true",
        type: "module",
      },
      // if you have shared info in svelte config file put in a separate module and use it also here
      kit: {
        includeVersionFile: true,
      },
    }),
  ],
});
