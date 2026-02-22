import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const { nostr } = params;
  let decodedNostr: string;

  try {
    decodedNostr = decodeURIComponent(nostr);
  } catch {
    decodedNostr = nostr; // デコード失敗時はそのまま使用
  }

  const newPath = decodedNostr.replace(/^(?:web\+)?nostr:\/?\/?/, "");
  throw redirect(302, newPath);
};
