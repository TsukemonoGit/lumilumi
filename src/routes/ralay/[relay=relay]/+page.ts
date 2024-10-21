import { ogDescription } from "$lib/stores/stores";
import type { PageLoad, RouteParams } from "./$types";

export const load: PageLoad<{
  relay: string;
}> = ({ params }: { params: RouteParams }) => {
  const relayURL = `wss://+${params}`;
  ogDescription.set(`${relayURL} Timeline`);

  return { relay: relayURL };
};
