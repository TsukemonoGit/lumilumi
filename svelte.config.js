import { preprocessMeltUI, sequence } from "@melt-ui/pp";
import adapter from "@sveltejs/adapter-auto";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
/** @type {import('@sveltejs/kit').Config}*/
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: sequence([vitePreprocess(), preprocessMeltUI()]),
  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter(),
    serviceWorker: {
      //pwa仮想モジュール（virtual:pwa-registerまたはvirtual:pwa-register/svelte）を使用している場合は、SvelteKitの設定からサービスワーカーの登録を除外する必要があります：
      register: false,
    },

    // 旧:csrf: { checkOrigin: false },
    // これつけないと共有のときにCross-site POST form submissions are forbiddenがでる
    // 旧: csrf: { checkOrigin: false } / trustedOrigins: ["https://..."]
    // Web Share Target の POST は OS/ブラウザが Origin を送信しないためワイルドカードで許可
    csrf: {
      trustedOrigins: ["*"],
    },
  },
  // compilerOptions: { runes: true }
};
export default config;
