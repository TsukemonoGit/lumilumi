import { error } from "@sveltejs/kit";
import { relayRegex2 } from "$lib/func/regex";
import { ogDescription, ogTitle } from "$lib/stores/stores";
import type { PageLoad, RouteParams } from "./$types";

export const load: PageLoad<{
  relay: string;
}> = ({ params }: { params: RouteParams }) => {
  const decoded = decodeURIComponent(params.relay);

  if (!relayRegex2.test(decoded)) {
    error(400, "Invalid relay URL");
  }

  let relayURL: URL;
  try {
    relayURL = new URL(decoded);
  } catch {
    error(400, "Invalid relay URL");
  }
  ogTitle.set(`Lumilumi - ${relayURL.href} Timeline`);
  ogDescription.set(`${relayURL.href} Timeline`);

  return { relay: relayURL.href };
};
