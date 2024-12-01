<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { loginUser, queryClient, slicedEvent } from "$lib/stores/stores";
  import { QueryObserver, type QueryKey } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";
  import { onDestroy, type Snippet } from "svelte";

  interface Props {
    id: string;
    content: Snippet<[{ event: Nostr.Event }]>;
    loading: Snippet;
  }
  let { id, content, loading }: Props = $props();
  //export let req: RxReqBase | undefined = undefined;
  let _result: { data: EventPacket; status: any; error: any } | undefined =
    $state();

  let data = $derived(_result?.data);
  const observer2 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "repost", id, $loginUser],
  });
  const unsubscribe = observer2.subscribe((result: any) => {
    if (
      !_result?.data?.event ||
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
</script>

{#if data?.event}
  {@render content({ event: data.event })}
{:else}
  {@render loading?.()}
{/if}
