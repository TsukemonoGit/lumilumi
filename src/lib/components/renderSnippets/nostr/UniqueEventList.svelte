<script lang="ts">
  import { useUniqueEventList } from "$lib/stores/useUniqueEventList";
  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import type { Snippet } from "svelte";

  interface Props {
    queryKey: QueryKey;
    filters: Nostr.Filter[];
    req:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error: Snippet;
    nodata: Snippet;
    content: Snippet<[{ events: Nostr.Event[]; status: ReqStatus }]>;
    loading: Snippet;
  }

  let {
    queryKey,
    filters,
    req = undefined,
    error,
    nodata,
    loading,
    content,
  }: Props = $props();

  let result = $derived(useUniqueEventList(queryKey, filters, req));
  $effect(() => {
    const currentResult = result;
    return () => currentResult.destroy();
  });
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
</script>

{#if $errorData}
  {@render error?.()}
{:else if $data && $data?.length > 0}
  {@render content({
    events: $data?.map(({ event }) => event),
    status: $status,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
