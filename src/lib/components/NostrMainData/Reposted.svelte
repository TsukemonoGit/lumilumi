<script lang="ts">
  import type { ReqStatus, RxReqBase } from "$lib/types";

  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type Nostr from "nostr-typedef";

  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";

  export let id: string;
  export let req: RxReqBase | undefined = undefined;
  let _result: { data: any; status: any; error: any };

  const observer2 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "repost", id],
  });

  $: data = _result?.data;
  $: status = _result?.status;
  $: error = _result?.error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { event: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if error}
  <slot name="error" {error} />
{:else if data}
  <slot event={data?.event} {status} />
{:else if status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
