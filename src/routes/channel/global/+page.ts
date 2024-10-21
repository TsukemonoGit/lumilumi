import { ogDescription } from "$lib/stores/stores";
import type { PageLoad } from "./$types";

export const load: PageLoad = () => {
  ogDescription.set("Public Chat Global Timeline");
};
