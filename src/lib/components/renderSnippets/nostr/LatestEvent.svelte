<!--LatestEvent.svelte-->
<script lang="ts">
  import { useLatestEvent } from "$lib/stores/useLatestEvent";

  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import { untrack, type Snippet } from "svelte";
  interface Props {
    relays?: string[] | undefined;
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: Snippet<[Error]>;
    nodata?: Snippet;
    loading?: Snippet;

    success?: Snippet<[{ event: Nostr.Event; status: ReqStatus }]>;
    onChange?: (metadata: Nostr.Event | undefined) => void;
  }
  let {
    req = undefined,
    relays = undefined,
    queryKey,
    filters,
    error,
    loading,
    nodata,
    success,
    onChange,
  }: Props = $props();

  let max3relays = $derived(relays ? relays.slice(0, 3) : undefined);
  let result = $derived(useLatestEvent(queryKey, filters, req, max3relays));
  $effect(() => {
    const currentResult = result;
    return () => currentResult.destroy();
  });
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
  let event = $derived($data?.event);

  $effect(() => {
    if (event) {
      untrack(() => onChange?.(event));
    }
  });
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $status === "success" && !$data}
  {@render nodata?.()}
{:else if event}
  {@render success?.({ event: event, status: $status })}
{:else}
  {@render loading?.()}
{/if}
