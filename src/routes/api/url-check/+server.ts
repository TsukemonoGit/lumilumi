// src/routes/api/url-check/+server.ts
import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url: request }) => {
  const targetUrl = request.searchParams.get("url");

  if (!targetUrl) {
    throw error(400, { message: "URL parameter is required" });
  }

  try {
    const response = await fetch(targetUrl, { method: "HEAD" });
    const contentType = response.headers.get("Content-Type");

    return new Response(
      JSON.stringify({
        contentType,
        status: response.status,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        contentType: null,
        error: err instanceof Error ? err.message : String(err),
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
