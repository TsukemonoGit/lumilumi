<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import { readable } from "svelte/store";
  import type Nostr from "nostr-typedef";
  import { type DefaultRelayConfig, type RxNostr } from "rx-nostr";
  import { useRepReactionList } from "$lib/stores/useRepReactionList";
  export let rxNostr: RxNostr | undefined = undefined;
  export let req: RxReqBase | undefined = undefined;

  export let filters: Nostr.Filter[] = [];
  let result: { data: any; status: any; error: any };
  $: if (filters.length > 0) {
    result = useRepReactionList(rxNostr, filters, req);
  }
  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { events: Nostr.Event[]; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot events={$data?.event} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
