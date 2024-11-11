import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { svelteTesting } from "@testing-library/svelte/vite";
export default defineConfig({
  plugins: [
    svelteTesting(),
    sveltekit(),
    SvelteKitPWA({
      devOptions: {
        //devで確認したい場合は、プラグイン設定にdevOptionsオプションを追加してください（Web App Manifestと生成されたサービスワーカーが得られます）：
        enabled: true,
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
                accept: ["image/*,video/*,audio/*"],
              },
            ],
          },
        },
      },
      injectRegister: "auto", //vite-plugin-pwa プラグインは、injectRegister 設定オプション (オプション) を使って、サービスワーカーを自動的に登録します。 injectRegister プラグインオプションを設定したい場合：

      registerType: "autoUpdate",
      workbox: {
        globPatterns: [
          "client/**/*.{js,css,ico,png,svg,webp,webmanifest}",
          "prerendered/**/*.html",
        ],
      }, //https://vite-pwa-org.netlify.app/guide/service-worker-precache.html#precache-manifest
    }),
    //   {
    //   registerType: "autoUpdate",
    //   devOptions: {
    //     enabled: true,
    //   },
    //   workbox: {
    //     globPatterns: [
    //       "client/**/*.{js,css,ico,png,svg,webp,webmanifest}",
    //       "prerendered/**/*.html",
    //     ],
    //   },
    // }
  ],
});
