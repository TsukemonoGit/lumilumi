<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type Nostr from "nostr-typedef";

  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";

  export let id: string;
  let _result: { data: any; status: any; error: any };
  // afterUpdate(() => {
  //   reactionData = $queryClient.getQueryData([
  //     "reactions",
  //     "reaction",
  //     id,
  //   ]) as EventPacket;
  //   repostData = $queryClient.getQueryData([
  //     "reactions",
  //     "repost",
  //     id,
  //   ]) as EventPacket;
  //   console.log(reactionData);
  // });

  const observer1 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "reaction", id],
  });
  const unsubscribe1 = observer1.subscribe((result: any) => {
    if (result?.data) {
      _result = result;
    }
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
