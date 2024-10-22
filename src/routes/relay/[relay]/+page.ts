import { ogDescription } from "$lib/stores/stores";
import type { PageLoad, RouteParams } from "./$types";

export const load: PageLoad<{
  relay: string;
}> = ({ params }: { params: RouteParams }) => {
  console.log(params.relay);
  const relayURL = `wss://${params.relay}`;

  ogDescription.set(`${relayURL} Timeline`);

  return { relay: relayURL };
};
