<script lang="ts">
  import { useUniqueEventList } from "$lib/stores/useUniqueEventList";
  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined = undefined;

  $: result = useUniqueEventList(queryKey, filters, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;

  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data && $data?.length > 0}
  <slot events={$data?.map(({ event }) => event)} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
