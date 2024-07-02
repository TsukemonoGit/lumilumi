<script lang="ts">
  import { app } from "$lib/stores/stores";
  import { useReplaceableEvent } from "$lib/stores/useReplaceableEvent";
  import type { RxReqBase, ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  export let queryKey: QueryKey;
  export let pubkey: string;
  export let req: RxReqBase | undefined = undefined;

  $: result = useReplaceableEvent($app?.rxNostr, queryKey, pubkey, 10005, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  $: console.log($data?.event);
  interface $$Slots {
    default: { event: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot event={$data?.event} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
