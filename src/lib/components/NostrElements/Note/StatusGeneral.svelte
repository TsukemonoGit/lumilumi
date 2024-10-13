<script lang="ts">
  import type Nostr from "nostr-typedef";

  import { queryClient, slicedEvent } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";

  import {
    type QueryKey,
    type SetDataOptions,
    createQuery,
  } from "@tanstack/svelte-query";

  export let pubkey: string;
  let data: EventPacket;

  $: if ($slicedEvent) {
    const res: EventPacket | undefined = $queryClient.getQueryData([
      "userStatus",
      "general",
      pubkey,
    ]);
    if (res) {
      data = res;
      //console.log(data);
      //これだと一回TLに出てこないと設定変わらない
      createQuery({
        queryKey: ["userStatus", "general", pubkey],
        initialData: res,
        staleTime: Infinity,
        gcTime: Infinity,
      });
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
