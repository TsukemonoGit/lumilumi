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

  const { queryKey, filters, req, error, loading, nodata, content }: Props =
    $props();

  const result = $derived(useUniqueEventList(queryKey, filters, req));
  const data = $derived(result.data);
  const status = $derived(result.status);
  const errorData = $derived(result.error);
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
