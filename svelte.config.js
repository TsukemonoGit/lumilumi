import { preprocessMeltUI, sequence } from "@melt-ui/pp";
import adapter from "@sveltejs/adapter-cloudflare";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
/** @type {import('@sveltejs/kit').Config}*/
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    // Cloudflare Workers (static assets) 向け。デプロイ設定は wrangler.jsonc を参照。
    adapter: adapter(),
    serviceWorker: {
      //pwa仮想モジュール（virtual:pwa-registerまたはvirtual:pwa-register/svelte）を使用している場合は、SvelteKitの設定からサービスワーカーの登録を除外する必要があります：
      register: false,
    },

    // 旧:csrf: { checkOrigin: false },
    // これつけないと共有のときにCross-site POST form submissions are forbiddenがでる

    csrf: {
      trustedOrigins: ["*"],
    },
  },
  // compilerOptions: { runes: true }
};
export default config;
