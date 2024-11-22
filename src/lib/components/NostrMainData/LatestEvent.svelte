<script lang="ts">
  import { useLatestEvent } from "$lib/stores/useLatestEvent";

  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";

  export let relays: string[] | undefined = undefined;
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
  $: max3relays = relays ? relays.slice(0, 3) : undefined;
  $: result = useLatestEvent(queryKey, filters, req, max3relays);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  interface $$Slots {
    default: { event: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
  //$: console.log(queryKey, $data, $status, relays);
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $status === "success" && !$data}
  <slot name="nodata" />
{:else if $data !== undefined}
  <slot event={$data.event} status={$status} />
{:else}
  <slot name="loading" />
{/if}
