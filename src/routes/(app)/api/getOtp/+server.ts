import type { RequestHandler } from "./$types";
import { error } from "@sveltejs/kit";
import DataStore from "../datastore"; // データストアをインポート

export const GET: RequestHandler = async ({ url: request }) => {
  const pubkey = request.searchParams.get("pubkey");
  const code = request.searchParams.get("code");

  if (!pubkey || !code) {
    throw error(404, {
      message: "require pubkey and code param",
    });
  }

  const dataStore = DataStore.getInstance();
  const storedCode = dataStore.get(pubkey);

  if (storedCode === parseInt(code)) {
    // コードが一致
    dataStore.delete(pubkey); // 一度使ったコードは削除
    return new Response(JSON.stringify({ message: "Code is valid" }), {
      status: 200,
    });
  } else {
    // コードが不一致
    return new Response(JSON.stringify({ message: "Invalid code" }), {
      status: 401,
    });
  }
};
