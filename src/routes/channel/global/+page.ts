import { ogDescription, ogTitle } from "#lib/stores/stores.ts";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  ogTitle.set("Lumilumi - Public Chat");
  ogDescription.set("Public Chat Global Timeline");
};
