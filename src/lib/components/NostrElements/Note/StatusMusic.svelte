<script lang="ts">
  import type Nostr from "nostr-typedef";

  import { queryClient, slicedEvent } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";

  export let pubkey: string;
  let data: EventPacket;

  $: if ($slicedEvent) {
    const res: EventPacket | undefined = $queryClient.getQueryData([
      "userStatus",
      "music",
      pubkey,
    ]);
    if (res) {
      data = res;
      console.log(data);
    }
  }

  interface $$Slots {
    default: { event: Nostr.Event };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if !data}
  <slot name="loading" />
{:else if data}
  <slot event={data?.event} />
{/if}
