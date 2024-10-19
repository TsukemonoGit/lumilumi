<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";

  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";
  import { onDestroy } from "svelte";

  export let id: string;
  //export let req: RxReqBase | undefined = undefined;
  let _result: { data: EventPacket; status: any; error: any };

  const observer2 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "repost", id],
  });
  const unsubscribe = observer2.subscribe((result: any) => {
    if (
      !_result?.data ||
      (result?.data &&
        result.data.event &&
        result.data.event.created_at > _result.data.event.created_at)
    ) {
      _result = result;
    }
  });

  // Cleanup the subscription when the component is destroyed
  onDestroy(() => {
    //console.log("destroy");
    unsubscribe();
    // $queryClient.removeQueries({ queryKey: ["reactions", "repost", id] });//まだこのIDがTLにいるかもしれないからけさない
    //けさなくてもstaletime gctime設定されてるから無限に残ることはない
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

{#if data?.event}
  <slot event={data?.event} {status} />
{:else if error}
  <slot name="error" {error} />
{:else if status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
