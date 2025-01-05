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
  // export let id: string;
  let data: Nostr.Event | undefined = $state();

  // let data = $derived(_result?.data);
  let unsubscribe: () => void;

  onMount(() => {
    const observer1 = new QueryObserver(queryClient, {
      queryKey: ["reactions", id, "reaction", $loginUser],
    });
    unsubscribe = observer1.subscribe((result: any) => {
      const packets = result?.data as EventPacket[];
      if (packets) {
        console.log(packets);
      }
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
  //$inspect(data);
  //});
  // Cleanup the subscription when the component is destroyed
  onDestroy(() => {
    unsubscribe();
    // queryClient.removeQueries({ queryKey: queryKey });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
</script>

<!-- {observer1?.hasListeners()}
<div class="break-all">status:{status}</div>
<div class="break-all">data:{JSON.stringify(data?.event?.content ?? "")}</div>
<div class="break-all">error:{error}</div> -->

{#if data}
  {@render content?.({ event: data })}
  <!-- <slot event={data?.event} {status} /> -->
{:else}
  {@render loading?.()}
{/if}
