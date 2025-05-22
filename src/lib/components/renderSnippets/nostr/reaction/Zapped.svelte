<script lang="ts">
  import type Nostr from "nostr-typedef";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";

  import { onDestroy, onMount } from "svelte";
  import type { EventPacket } from "rx-nostr";

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

  let unsubscribe: () => void;

  onMount(() => {
    //subscribeする前にデータ持ってたらsubscribeしても取得できない？
    const queryData: EventPacket[] | undefined = queryClient.getQueryData([
      "reactions",
      id,
      "zapped",
      $loginUser,
    ]);
    if (queryData) {
      data = queryData[0].event;
    }
    const observer1 = new QueryObserver(queryClient, {
      queryKey: ["reactions", id, "zapped", $loginUser],
    });
    unsubscribe = observer1.subscribe((result: any) => {
      const packets = result?.data as EventPacket[] | undefined;
      if (
        packets &&
        packets.length > 0 &&
        (!data || packets[0].event.created_at > data.created_at)
      ) {
        // console.log(result);
        data = packets[0].event;
        //  const data = queryClient?.getQueryData(queryKey);
        //  console.log(data);
        //status = "success";
      }
    });
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
{:else}
  {@render loading?.()}
{/if}
