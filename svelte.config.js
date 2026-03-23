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
export const handle: Handle = async ({ event, resolve }) => {
  // CSRF保護（Web Share Target以外のPOSTリクエスト）
  const isShareTarget =
    event.url.pathname === "/post" && event.request.method === "POST";

  if (!isShareTarget && event.request.method === "POST") {
    const origin = event.request.headers.get("origin");
    if (origin && !allowedOrigins.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  // レート制限チェック
  if (RATE_LIMITED_PATHS.some((path) => event.url.pathname.startsWith(path))) {
    const ip =
      event.request.headers.get("cf-connecting-ip") ??
      event.request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      event.getClientAddress();

    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(RATE_LIMIT_WINDOW_MS / 1000),
        },
      });
    }
  }

  // ロケール設定
  const langHeader = event.request.headers
    .get("accept-language")
    ?.split(",")[0];
  const lang = langHeader?.split("-")[0];
  if (lang) {
    setLocale(lang);
    await waitLocale();
  }

  // OPTIONSプリフライト(resolve不要)
  if (
    event.url.pathname.startsWith("/api") &&
    event.request.method === "OPTIONS"
  ) {
    const origin = event.request.headers.get("Origin");
    if (!origin || !allowedOrigins.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, X-Requested-With, X-CSRF-Token",
      },
    });
  }

  // resolve を1箇所に集約
  const response = await resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", get(locale)),
  });

  // CORSヘッダー(APIルートのみ)
  if (event.url.pathname.startsWith("/api")) {
    const origin = event.request.headers.get("Origin");
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.append("Access-Control-Allow-Origin", origin);
    }
  }

  // セキュリティヘッダーを全レスポンスに付与
  applySecurityHeaders(response);

  return response;
};
    },
  },
  // compilerOptions: { runes: true }
};
export default config;
