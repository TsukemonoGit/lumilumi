import { ogDescription, ogTitle } from "$lib/stores/stores";

export const load = async () => {
  ogTitle.set("Lumilumi");
  ogDescription.set("The Nostr Client");
};
