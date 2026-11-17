import { ogDescription, ogTitle } from "#lib/stores/stores.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  ogTitle.set("Lumilumi - Channel");
  ogDescription.set("User Channel List");
};
