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

  interface Props {
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
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [{ events: Nostr.Event[]; status: ReqStatus }]
    >;
  }

  let { queryKey, filters, req, error, loading, nodata, content }: Props =
    $props();

  let result = $derived(useUniqueEventList(queryKey, filters, req));
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data?.length > 0}
  {@render content?.({
    events: $data?.map(({ event }) => event),
    status: $status,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
