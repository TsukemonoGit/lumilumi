import { ogDescription, ogTitle } from "$lib/stores/stores";
import type { PageLoad, RouteParams } from "./$types";

export const load: PageLoad = ({ params }: { params: RouteParams }) => {
  ogTitle.set(`Lumilumi`);
  ogDescription.set(`the nostr client`);

  return;
};
