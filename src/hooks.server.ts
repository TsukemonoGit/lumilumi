import type { Handle } from "@sveltejs/kit";
import { setLocale, locale, waitLocale } from "@konemono/svelte5-i18n";
import { get } from "svelte/store";

const allowedOrigins = ["https://lumilumi.vercel.app", "https://lumilumi.app"];

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_MAX_ENTRIES = 10000;

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
  return entry.count > RATE_LIMIT_MAX;
}

const RATE_LIMITED_PATHS = ["/api/ogp", "/api/url-check"];

// TODO: app.html の model-viewer.min.js の実際のホストに変更すること
const MODEL_VIEWER_HOST = "https://ajax.googleapis.com";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    `script-src 'self' ${MODEL_VIEWER_HOST}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' ws: wss: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
};

function applySecurityHeaders(response: Response): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

export const handle: Handle = async ({ event, resolve }) => {
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

  // OPTIONSプリフライト（resolve不要）
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

  // CORSヘッダー（APIルートのみ）
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
