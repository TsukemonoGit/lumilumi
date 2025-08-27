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
  import { untrack } from "svelte";
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
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    children?: import("svelte").Snippet<
      [{ event: Nostr.Event; status: ReqStatus }]
    >;
    onChange?: (metadata: Nostr.Event) => void;
  }
  const {
    req = undefined,
    relays = undefined,
    queryKey,
    filters,
    error,
    loading,
    nodata,
    children,
    onChange,
  }: Props = $props();

  const max3relays = $derived(relays ? relays.slice(0, 3) : undefined);
  const result = $derived(useLatestEvent(queryKey, filters, req, max3relays));
  const data = $derived(result.data);
  const status = $derived(result.status);
  const errorData = $derived(result.error);

  $effect(() => {
    if ($data?.event) {
      untrack(() => onChange?.($data?.event));
    }
  });
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $status === "success" && !$data}
  {@render nodata?.()}
{:else if $data && $data.event}
  {@render children?.({ event: $data.event, status: $status })}
{:else}
  {@render loading?.()}
{/if}
