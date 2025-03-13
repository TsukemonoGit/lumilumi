import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  return /^(?:web\+)?nostr:\/?\/?/.test(param); //note nevent
}) satisfies ParamMatcher;
