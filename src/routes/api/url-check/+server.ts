// src/routes/api/url-check/+server.ts
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url: request }) => {
  const targetUrl = request.searchParams.get("url");

  if (!targetUrl) {
    throw error(400, { message: "URL parameter is required" });
  }

  try {
    const parsed = new URL(targetUrl);

    const ALLOWED_PROTOCOLS = ["https:"];
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      throw error(400, { message: "Only HTTPS URLs are allowed" });
    }

    const blockedRanges =
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|\[::1\]|\[?fc[0-9a-f]{2}:|\[?fd[0-9a-f]{2}:|\[?fe80:)/i;
    if (blockedRanges.test(parsed.hostname)) {
      throw error(403, { message: "Private addresses are not allowed" });
    }

    const response = await fetch(targetUrl, { method: "HEAD" });
    const contentType = response.headers.get("Content-Type");

    return new Response(
      JSON.stringify({
        contentType,
        status: response.status,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      throw err;
    }
    return new Response(
      JSON.stringify({
        contentType: null,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
