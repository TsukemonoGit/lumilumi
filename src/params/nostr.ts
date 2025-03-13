import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  return /^nostr:\/?\/?/.test(param); //note nevent
}) satisfies ParamMatcher;
