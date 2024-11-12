import { preprocessMeltUI, sequence } from "@melt-ui/pp";
import adapter from '@sveltejs/adapter-vercel';
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
    serviceWorker: {//pwa仮想モジュール（virtual:pwa-registerまたはvirtual:pwa-register/svelte）を使用している場合は、SvelteKitの設定からサービスワーカーの登録を除外する必要があります：
      register: false
    },
    csrf: false,
    files: {
      serviceWorker: 'src/service-worker.js', // or `src/my-sw.ts`
    }
  }
};
export default config;
