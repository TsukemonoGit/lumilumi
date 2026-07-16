import { error } from "@sveltejs/kit";
import { relayRegex2 } from "$lib/func/regex";
import { ogDescription, ogTitle } from "$lib/stores/stores";
import type { PageLoad, RouteParams } from "./$types";

export const load: PageLoad<{
  relay: string;
}> = ({ params }: { params: RouteParams }) => {
  const decoded = decodeURIComponent(params.relay);

  if (!relayRegex2.test(decoded)) {
    error(404, "Invalid relay URL");
  }

  const relayURL = new URL(decoded);
  ogTitle.set(`Lumilumi - ${relayURL.href} Timeline`);
  ogDescription.set(`${relayURL.href} Timeline`);

  return { relay: relayURL.href };
};
