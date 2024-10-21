import type { PageLoad } from "./$types";
import { ogDescription } from "$lib/stores/stores";

export const load: PageLoad = () => {
  ogDescription.set("About Lumilumi");
};
