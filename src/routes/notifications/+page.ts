import { ogDescription, ogTitle } from "$lib/stores/stores";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  ogTitle.set("Lumilumi - Notifications");
  ogDescription.set("Notifications");
};
