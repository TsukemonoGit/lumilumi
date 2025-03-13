import { redirect } from "@sveltejs/kit";

export const load = async ({ params, setHeaders }) => {
  // URL が "nostr:" または "nostr://" で始まる場合、リダイレクトを行う
  const { nostr } = params;
  // `nostr` パラメータを取得してデコード
  const decodedNostr = decodeURIComponent(nostr);
  const newPath = decodedNostr.replace(/^(?:web\+)?nostr:\/?\/?/, "");
  throw redirect(302, newPath); // 302リダイレクトで新しいURLに移動
};
