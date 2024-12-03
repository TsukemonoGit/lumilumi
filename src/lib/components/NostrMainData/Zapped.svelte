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
    error?: import("svelte").Snippet;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [
        {
          event: Nostr.Event;
          status: ReqStatus;
        },
      ]
    >;
  }

  let { id, error, nodata, loading, content }: Props = $props();

  let _result: { data: EventPacket; status: any; error: any } | undefined =
    $state();

  const observer2 = new QueryObserver($queryClient, {
    queryKey: ["reactions", "zapped", id, $loginUser],
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
    unsubscribe();
    // $queryClient.removeQueries({ queryKey: ["reactions", "zapped", id] });//まだこのIDがTLにいるかもしれないからけさない
    //けさなくてもstaletime gctime設定されてるから無限に残ることはない
  });

  let data = $derived(_result?.data);
  let status = $derived(_result?.status);
  let errorData = $derived(_result?.error);
</script>

{#if errorData}
  {@render error?.()}
{:else if data}
  {@render content?.({ event: data.event, status: status })}
  <!-- <slot events={$data.event} {status} /> -->
{:else if status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
