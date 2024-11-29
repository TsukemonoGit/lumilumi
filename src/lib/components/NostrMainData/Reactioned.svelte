<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";
  import { onDestroy } from "svelte";

  export let id: string;
  let _result: { data: EventPacket; status: any; error: any };

  const observer1 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "reaction", id, $loginUser],
  });

  // let unsubscribe: () => void;
  // onMount(() => {
  //   const data = $queryClient?.getQueryData(queryKey);
  //   console.log(data);
  //   console.log($queryClient?.getQueriesData({ queryKey: queryKey }));
  const unsubscribe = observer1.subscribe((result: any) => {
    if (
      !_result?.data?.event ||
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

<!-- {observer1?.hasListeners()}
<div class="break-all">status:{status}</div>
<div class="break-all">data:{JSON.stringify(data?.event?.content ?? "")}</div>
<div class="break-all">error:{error}</div> -->

{#if data?.event}
  <slot event={data?.event} {status} />
{:else if error}
  <slot name="error" {error} />
{:else if status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
