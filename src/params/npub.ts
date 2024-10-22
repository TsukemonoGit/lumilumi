import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  return /^npub\w{59}$/.test(param) || /^nprofile\w{59,}$/.test(param); //npubの長さは固定
}) satisfies ParamMatcher;
