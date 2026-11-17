import { withPwa } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";
import { svelteTesting } from "@testing-library/svelte/vite";
import { preprocessMeltUI, sequence } from "@melt-ui/pp";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import adapter from "@sveltejs/adapter-cloudflare";

// @melt-ui/pp が svelte.config.js を探す際の console.debug を抑制
const _originalDebug = console.debug;
console.debug = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("no svelte config")) return;
  _originalDebug(...args);
};

export default defineConfig({
  server: {
    host: true,
    headers: {
      "Content-Security-Policy":
        "worker-src 'self'; script-src 'self'; manifest-src *;",
    },
    watch: {
      usePolling: true,
    },
  },
  plugins: [
    svelteTesting(),
    ...withPwa(
      {
        adapter: adapter(),
        preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
        serviceWorker: {
          register: false,
        },
        csrf: {
          trustedOrigins: ["*"],
        },
      },
      {
        strategies: "buildSW",
        injectRegister: "auto",
        registerType: "prompt",
        scope: "/",
        pwaAssets: {
          config: true,
        },
        manifest: {
          short_name: "lumilumi",
          name: "lumilumi",
          start_url: "/",
          scope: "/",
          display: "standalone",
          theme_color: "#e77700",
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
          protocol_handlers: [
            {
              protocol: "web+nostr",
              url: "./%s",
            },
          ],
        },
        buildSW: {
          swSrc: "./src/service-worker.ts",
          globPatterns: [
            "client/**/*.{js,css,ico,png,svg,webp,webmanifest}",
            "client/offline.html",
          ],
          globIgnores: ["node_modules/**/*"],
          globStrict: false,
        },


        devOptions: {
          enabled: true,
          suppressWarnings: process.env.SUPPRESS_WARNING === "true",
          type: "module",
        },
        kit: {
          includeVersionFile: true,
        },
      }
    ),
  ],
});
