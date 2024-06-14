import { sveltekit } from "@sveltejs/kit/vite";
import { SvelteKitPWA } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { svelteTesting } from "@testing-library/svelte/vite";
export default defineConfig({
  plugins: [
    svelteTesting(),
    sveltekit(),
    SvelteKitPWA({
      pwaAssets: {
        config: true,
      },
      manifest: {
        short_name: "lumilumi",
        name: "lumilumi",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#ffffff",
      },
      registerType: "autoUpdate",
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
