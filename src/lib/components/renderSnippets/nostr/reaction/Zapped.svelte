<script lang="ts">
  import type Nostr from "nostr-typedef";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";

  import { onDestroy } from "svelte";

  interface Props {
    id: string;

    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [
        {
          event: Nostr.Event;
        },
      ]
    >;
  }

  let { id, loading, content }: Props = $props();

  let data: Nostr.Event | undefined = $state();

  const observer2 = new QueryObserver(queryClient, {
    queryKey: ["reactions", id, "zapped", $loginUser],
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
    unsubscribe();
    // queryClient.removeQueries({ queryKey: ["reactions", "zapped", id] });//まだこのIDがTLにいるかもしれないからけさない
    //けさなくてもstaletime gctime設定されてるから無限に残ることはない
  });
</script>

{#if data}
  {@render content?.({ event: data })}
  <!-- <slot event={data?.event} {status} /> -->
{:else}
  {@render loading?.()}
{/if}
