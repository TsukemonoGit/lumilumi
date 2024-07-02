import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  return /^(naddr)1[023456789acdefghjklmnpqrstuvwxyz]{58,}$/.test(param); //note nevent
}) satisfies ParamMatcher;
