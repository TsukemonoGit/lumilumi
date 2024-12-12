<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";

  import { onDestroy, type Snippet } from "svelte";

  interface Props {
    id: string;
    content: Snippet<[{ event: Nostr.Event }]>;
    loading: Snippet;
  }
  let { id, content, loading }: Props = $props();
  //export let req: RxReqBase | undefined = undefined;
  let data: Nostr.Event | undefined = $state();

  const observer2 = new QueryObserver(queryClient, {
    queryKey: ["reactions", id, "repost", $loginUser],
  });
  const unsubscribe = observer2.subscribe((result: any) => {
    if (
      result?.data &&
      result.data.event &&
      (!data || result.data.event.created_at > data.created_at)
    ) {
      data = result.data.event;
    }
  });

  // Cleanup the subscription when the component is destroyed
  onDestroy(() => {
    //console.log("destroy");
    unsubscribe();
    // queryClient.removeQueries({ queryKey: ["reactions", "repost", id] });//まだこのIDがTLにいるかもしれないからけさない
    //けさなくてもstaletime gctime設定されてるから無限に残ることはない
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
</script>

{#if data}
  {@render content?.({ event: data })}
  <!-- <slot event={data?.event} {status} /> -->
{:else}
  {@render loading?.()}
{/if}
