import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  return true;
}) satisfies ParamMatcher;
