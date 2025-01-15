import { error } from "@sveltejs/kit";
//import { unfurl } from "unfurl.js";
import type { RequestHandler } from "./$types";

import { unfurl } from "./unfurlWrapper"; // ラッパーをインポート

export const GET: RequestHandler = async ({ url: request }) => {
  const url = request.searchParams.get("url");

  if (!url) {
    throw error(404, {
      message: "require url param",
    });
  }

  const result = await unfurl(url).catch((err) => {
    throw error(404, {
      message: err,
    });
  });

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
};
