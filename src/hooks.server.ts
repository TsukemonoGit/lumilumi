// hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { locale } from "svelte-i18n";

// 許可するオリジンを設定（必要に応じて）
const allowedOrigins = ["https://lumilumi.vercel.app/"]; //, "https://another-example.com"];

export const handle: Handle = async ({ event, resolve }) => {
  // Accept-Language ヘッダーを使用して言語設定
  const lang = event.request.headers.get("accept-language")?.split(",")[0];
  if (lang) {
    locale.set(lang);
  }

  // CORSのプリフライトリクエストに対応
  if (event.url.pathname.startsWith("/api")) {
    const origin = event.request.headers.get("Origin");
    const response = await resolve(event);

    // OPTIONSリクエスト（プリフライトリクエスト）
    if (event.request.method === "OPTIONS") {
      const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS", // POSTを追加
        "Access-Control-Allow-Headers":
          "Content-Type, X-Requested-With, X-CSRF-Token", // 必要なヘッダーを追加
      };

      if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
      } else {
        // 許可されていないオリジンの場合は403エラーを返す
        return new Response("Forbidden", { status: 403 });
      }

      return new Response(null, { headers });
    }

    // CORSのレスポンスヘッダー
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.append("Access-Control-Allow-Origin", origin);
    }

    return response;
  }

  // CSRFトークンの検証は不要 (Share APIの場合)
  if (event.url.pathname.startsWith("/post")) {
    // CSRFトークンの検証処理を行わない
  }

  return resolve(event);
};
