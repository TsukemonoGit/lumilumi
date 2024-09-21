<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";

  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver, type QueryKey } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";
  import { onDestroy, onMount } from "svelte";

  export let id: string;
  let _result: { data: EventPacket; status: any; error: any };
  const queryKey: QueryKey = ["reactions", "reaction", id];
  const observer1 = new QueryObserver($queryClient, {
    queryKey: queryKey,
  });

  // let unsubscribe: () => void;
  // onMount(() => {
  //   const data = $queryClient?.getQueryData(queryKey);
  //   console.log(data);
  //   console.log($queryClient?.getQueriesData({ queryKey: queryKey }));
  const unsubscribe = observer1.subscribe((result: any) => {
    if (
      !_result?.data ||
      (result?.data &&
        result.data.event &&
        result.data.event.created_at > _result.data.event.created_at)
    ) {
      _result = result;
      //  const data = $queryClient?.getQueryData(queryKey);
      //  console.log(data);
      status = "success";
    }
  });
  //});
  // Cleanup the subscription when the component is destroyed
  onDestroy(() => {
    unsubscribe();
    // $queryClient.removeQueries({ queryKey: queryKey });
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
