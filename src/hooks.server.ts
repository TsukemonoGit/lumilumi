// hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { setLocale, locale, waitLocale } from "@konemono/svelte5-i18n";
import { get } from "svelte/store";

const allowedOrigins = [
  "https://lumilumi.vercel.app/",
  "https://lumilumi.app/",
];

// レート制限設定
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX = 60; // 1分あたりの最大リクエスト数
const RATE_LIMIT_MAX_ENTRIES = 10000; // IPエントリの最大数（メモリリーク対策）

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  if (rateLimitMap.size >= RATE_LIMIT_MAX_ENTRIES) {
    for (const [key, entry] of rateLimitMap) {
      if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;

  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

const RATE_LIMITED_PATHS = ["/api/ogp", "/api/url-check"];

export const handle: Handle = async ({ event, resolve }) => {
  // レート制限チェック（対象パスのみ）
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

  const langHeader = event.request.headers
    .get("accept-language")
    ?.split(",")[0];

  const lang = langHeader?.split("-")[0];
  if (lang) {
    setLocale(lang);
    await waitLocale();
  }

  if (event.url.pathname.startsWith("/api")) {
    const origin = event.request.headers.get("Origin");
    const response = await resolve(event, {
      transformPageChunk: ({ html }) => html.replace("%lang%", get(locale)),
    });

    if (event.request.method === "OPTIONS") {
      const headers: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, X-Requested-With, X-CSRF-Token",
      };

      if (origin && allowedOrigins.includes(origin)) {
        headers["Access-Control-Allow-Origin"] = origin;
      } else {
        return new Response("Forbidden", { status: 403 });
      }

      return new Response(null, { headers });
    }

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.append("Access-Control-Allow-Origin", origin);
    }

    return response;
  }

  if (event.url.pathname.startsWith("/post")) {
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace("%lang%", get(locale)),
    });
  }

  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace("%lang%", get(locale)),
  });
};
