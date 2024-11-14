import { NIP05_REGEX } from "$lib/func/regex";
import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param) => {
  return (
    /^npub\w{59}$/.test(param) ||
    /^nprofile\w{59,}$/.test(param) ||
    NIP05_REGEX.test(param)
  ); //npubの長さは固定
}) satisfies ParamMatcher;
