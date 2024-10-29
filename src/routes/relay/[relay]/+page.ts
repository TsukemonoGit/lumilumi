import { ogDescription, ogTitle } from "$lib/stores/stores";
import type { PageLoad, RouteParams } from "./$types";

export const load: PageLoad<{
  relay: string;
}> = ({ params }: { params: RouteParams }) => {
  console.log(params.relay);

  const relayURL = new URL(decodeURIComponent(params.relay));
  ogTitle.set(`Lumilumi - ${relayURL.href} Timeline`);
  ogDescription.set(`${relayURL.href} Timeline`);

  return { relay: relayURL.href };
};
