import { redirect } from "@sveltejs/kit";

export const load = async ({ params, setHeaders }) => {
  // URL が "nostr:" または "nostr://" で始まる場合、リダイレクトを行う
  const { nostr } = params;

  const newPath = nostr.replace(/^nostr:\/?\/?/, "");
  throw redirect(302, newPath); // 302リダイレクトで新しいURLに移動
};
