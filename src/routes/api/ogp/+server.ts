// src/routes/api/ogp/+server.ts
import { error } from "@sveltejs/kit";
import { preview } from "linkpeek";
import type { RequestHandler } from "./$types";
import type { OgpResponse } from "$lib/func/ogp";

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
  /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|169\.254\.|::1|\[::1\]|\[?fc[0-9a-f]{2}:|\[?fd[0-9a-f]{2}:|\[?fe80:)/i;
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

  // linkpeek checks every redirect target too, and stops reading after </head>
  const page = await preview(url, {
    userAgent,
    timeout: 15000,
  }).catch((err) => {
    throw error(404, {
      message: err.message ?? String(err),
    });
  });
  if (page.statusCode >= 400) {
    throw error(404, { message: `HTTP ${page.statusCode}` });
  }

  // Same keys as the old unfurl.js response, which src/lib/func/ogp.ts reads
  const result: OgpResponse = {
    title: page.title ?? undefined,
    description: page.description ?? undefined,
    favicon: page.favicon ?? undefined,
    open_graph: {
      images: page.image ? [{ url: page.image }] : undefined,
      videos: page.video ? [{ url: page.video }] : undefined,
      audio: page.audio ? [{ url: page.audio }] : undefined,
    },
    twitter_card:
      page.twitterPlayer || page.twitterPlayerStream
        ? {
            players: [
              {
                url: page.twitterPlayer ?? "",
                stream: page.twitterPlayerStream ?? undefined,
              },
            ],
          }
        : undefined,
  };

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
