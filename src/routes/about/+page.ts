import type { PageLoad } from "./$types";
import { ogDescription, ogTitle } from "$lib/stores/stores";

export const load: PageLoad = () => {
  ogTitle.set("Lumilumi - About");
  ogDescription.set("Lumilumi is The Nostr Client");
};
