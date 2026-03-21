// src/routes/api/ogp/+server.ts
import { error } from "@sveltejs/kit";
import { unfurl } from "unfurl.js";
import type { RequestHandler } from "./$types";
import type { Metadata } from "unfurl.js/dist/types";

export const GET: RequestHandler = async ({ url: request }) => {
  const url = request.searchParams.get("url");

  if (!url) {
    throw error(404, {
      message: "require url param",
    });
  }

  const parsedUrl = new URL(url);

  const ALLOWED_PROTOCOLS = ["https:"];
  if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
    throw error(400, { message: "Only HTTPS URLs are allowed" });
  }

  const blockedRanges =
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|\[::1\])/i;
  if (blockedRanges.test(parsedUrl.hostname)) {
    throw error(403, { message: "Private addresses are not allowed" });
  }

  const host = parsedUrl.host.toLowerCase();

  let userAgent = "LumilumiOGPFetcher/1.0 (+https://lumilumi.app)";

  if (
    host.includes("amazon.") ||
    host.includes("twitter.com") ||
    host.includes("x.com") ||
    host.includes("t.co") ||
    host.includes("suno.com") ||
    host.includes("suno.ai")
  ) {
    userAgent = "facebookexternalhit";
  }

  const result: Metadata = await unfurl(url, {
    headers: {
      Accept: "text/html, application/xhtml+xml",
      "User-Agent": userAgent,
    },
  }).catch((err) => {
    throw error(404, {
      message: err.message ?? String(err),
    });
  });

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
