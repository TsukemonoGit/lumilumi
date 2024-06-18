<script lang="ts">
  //TimelineList.svelte
  import { useTimelineEventList } from "$lib/stores/useTimelineEventList";
  import type { ReqStatus, RxReqBase } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";

  export let queryKey: QueryKey;
  export let filters: Nostr.Filter[];
  export let req: RxReqBase | undefined = undefined;
  export let viewIndex: number;
  export let amount: number;
  // TODO: Check if $app.rxNostr is defined
  $: result = useTimelineEventList(queryKey, filters, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  let slicedEvent: Nostr.Event[];
  // Update filters with 'until' field for all items
  $: if ($data && viewIndex >= 0 && filters) {
    if (viewIndex + amount > $data.length) {
      const untilTimestamp = $data[$data.length - 1].event.created_at;

      filters = filters.map((filter) => ({
        ...filter,
        until: untilTimestamp,
      }));
    }
    slicedEvent = $data
      ?.map(({ event }) => event)
      .slice(viewIndex, viewIndex + amount);
  }
  // {#if viewIndex + amount < len}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus; len: number };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data && $data?.length > 0}
  <slot events={slicedEvent} status={$status} len={$data.length} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
