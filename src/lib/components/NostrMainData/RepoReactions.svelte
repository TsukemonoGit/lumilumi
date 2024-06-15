<script lang="ts">
  import type { ReqStatus, RxReqBase } from "$lib/types";

  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type Nostr from "nostr-typedef";
  import type { EventPacket, RxNostr } from "rx-nostr";

  import { queryClient } from "$lib/stores/stores";
  import { afterUpdate } from "svelte";
  import { QueryObserver } from "@tanstack/svelte-query";

  export let id: string;
  export let req: RxReqBase | undefined = undefined;
  let reactionData: EventPacket;
  let repostData: EventPacket;
  // afterUpdate(() => {
  //   reactionData = $queryClient.getQueryData(["reaction", id]) as EventPacket;
  //   repostData = $queryClient.getQueryData(["repost", id]) as EventPacket;
  //   console.log(reactionData);
  // });

  const observer = new QueryObserver($queryClient, {
    queryKey: ["reaction", id],
  });

  const unsubscribe = observer.subscribe((result) => {
    console.log(result);

    unsubscribe();
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: {
      repostData?: Nostr.Event | undefined;
      reactionData?: Nostr.Event | undefined;
    };
  }
</script>

<slot repostData={repostData?.event} reactionData={reactionData?.event} />
