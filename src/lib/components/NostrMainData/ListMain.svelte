<script lang="ts">
  import { useReplaceableEventList } from "$lib/stores/useReplaceableEventList";
  import { useUniqueEventList } from "$lib/stores/useUniqueEventList";
  import type { RxReqBase, ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  export let queryKey: QueryKey;
  export let pubkey: string;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined = undefined;
  $: result = useReplaceableEventList(queryKey, pubkey, 30000, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  $: console.log($data);
  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <slot events={$data.map(({ event }) => event)} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
