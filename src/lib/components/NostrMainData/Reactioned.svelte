<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";
  import type { EventPacket } from "rx-nostr";
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
  // export let id: string;
  let _result: { data: EventPacket; status: any; error: any } | undefined =
    $state();

  let data = $derived(_result?.data);

  const observer1 = new QueryObserver(queryClient, {
    queryKey: ["reactions", "reaction", id, $loginUser],
  });

  const unsubscribe = observer1.subscribe((result: any) => {
    if (
      !_result?.data?.event ||
      (result?.data &&
        result.data.event &&
        result.data.event.created_at > _result.data.event.created_at)
    ) {
      _result = result;
      //  const data = queryClient?.getQueryData(queryKey);
      //  console.log(data);
      status = "success";
    }
  });
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

{#if data?.event}
  {@render content?.({ event: data?.event })}
  <!-- <slot event={data?.event} {status} /> -->
{:else}
  {@render loading?.()}
{/if}
