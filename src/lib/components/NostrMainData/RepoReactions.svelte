<script lang="ts">
  import type { ReqStatus, RxReqBase } from "$lib/types";

  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type Nostr from "nostr-typedef";
  import type { RxNostr } from "rx-nostr";

  import { useRepReactioned } from "$lib/stores/useRepReaction";
  export let rxNostr: RxNostr;

  export let pubkey: string;
  export let id: string;
  export let req: RxReqBase | undefined = undefined;

  $: results = useRepReactioned(rxNostr, ["reaction", id], pubkey, id, req);

  $: data = results.data;
  $: status = results.status;
  $: error = results.error;
  $: reactionData = $data?.find((item) => item.event.kind === 7);
  $: repostData = $data?.find(
    (item) => item.event.kind === 6 || item.event.kind === 16
  );
  $: console.log($data);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: {
      status: ReqStatus;
      repostData?: Nostr.Event | undefined;
      reactionData?: Nostr.Event | undefined;
    };
  }
</script>

<slot
  repostData={repostData?.event}
  status={$status}
  reactionData={reactionData?.event}
/>
