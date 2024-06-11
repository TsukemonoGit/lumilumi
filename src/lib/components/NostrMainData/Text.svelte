<script lang="ts">
  import { useEvent } from "$lib/stores/useEvent";
  import type { RxReqBase, ReqStatus } from "$lib/types";
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";

  export let queryKey: QueryKey;
  export let id: string;
  export let req: RxReqBase | undefined = undefined;

  // TODO: Check if $app.rxNostr is defined
  $: result = useEvent(queryKey, id, req);
  $: data = result.data;
  $: status = result.status;
  $: error = result.error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { text: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot text={$data?.event} status={$status} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
