import { error } from "@sveltejs/kit";
import { unfurl } from "unfurl.js";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url: request }) => {
  const url = request.searchParams.get("url");

  if (!url) {
    throw error(404, {
      message: "require url param",
    });
  }

  const parsedUrl = new URL(url);
  const host = parsedUrl.host.toLowerCase();

  let userAgent = "LumilumiOGPFetcher/1.0 (+https://lumilumi.app)";

  // AmazonかTwitterドメインならfacebookexternalhitに切り替え
  if (
    host.includes("amazon.") ||
    host.includes("twitter.com") ||
    host.includes("x.com") ||
    host.includes("t.co")
  ) {
    userAgent = "facebookexternalhit";
  }

  const result = await unfurl(url, {
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
