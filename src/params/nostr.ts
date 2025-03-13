import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  let decodedNostr: string;
  try {
    decodedNostr = decodeURIComponent(param);
  } catch {
    decodedNostr = param; // デコードできなかった場合はそのまま使う
  }

  return /^(?:web\+)?nostr:\/?\/?/.test(decodedNostr);
}) satisfies ParamMatcher;
