import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  // `nostr` パラメータを取得してデコード
  const decodedNostr = decodeURIComponent(param);
  return /^(?:web\+)?nostr:\/?\/?/.test(decodedNostr); //note nevent
}) satisfies ParamMatcher;
