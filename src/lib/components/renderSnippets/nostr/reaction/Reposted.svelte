<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";

  import { onDestroy, onMount, type Snippet } from "svelte";
  import type { EventPacket } from "rx-nostr";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    id: string;
    content: Snippet<[{ event: Nostr.Event }]>;
    loading: Snippet;
  }
  let { id, content, loading }: Props = $props();

  let data: Nostr.Event | undefined = $state();

  let unsubscribe: () => void;

  onMount(() => {
    //subscribeする前にデータ持ってたらsubscribeしても取得できない？
    const queryData: EventPacket[] | undefined = queryClient.getQueryData([
      "reactions",
      id,
      "repost",
      lumiSetting.get().pubkey,
    ]);
    if (queryData) {
      data = queryData[0].event;
    }
    const observer1 = new QueryObserver(queryClient, {
      queryKey: ["reactions", id, "repost", lumiSetting.get().pubkey],
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
    //console.log("destroy");
    unsubscribe();
    // queryClient.removeQueries({ queryKey: ["reactions", "repost", id] });//まだこのIDがTLにいるかもしれないからけさない
    //けさなくてもstaletime gctime設定されてるから無限に残ることはない
  });
</script>

{#if data}
  {@render content?.({ event: data })}
{:else}
  {@render loading?.()}
{/if}
