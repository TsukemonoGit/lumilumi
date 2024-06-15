<script lang="ts">
  import { useReactioned } from "$lib/stores/useReactioned";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import { app, queryClient } from "$lib/stores/stores";
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import { type QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type { RxNostr } from "rx-nostr";
  export let rxNostr: RxNostr;
  export let queryKey: QueryKey;
  export let pubkey: string;
  export let id: string;
  export let req: RxReqBase | undefined = undefined;

  $: result = useReactioned(rxNostr, queryKey, pubkey, id, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;
  //$: console.log($data);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { reactionData: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot reactionData={$data?.event} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
