<script lang="ts">
  import { useAllReactions } from "$lib/stores/useAllReactions";
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
    id?: string | undefined;
    atag?: string | undefined;
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
      [
        {
          kind1: Nostr.Event[];
          kind6: Nostr.Event[];
          kind7: Nostr.Event[];
          kind9735: Nostr.Event[];
          status: ReqStatus;
        },
      ]
    >;
  }

  let {
    req = undefined,
    id = undefined,
    atag = undefined,
    queryKey,

    error,
    loading,
    nodata,
    children,
  }: Props = $props();

  let result = $derived(useAllReactions(queryKey, id, atag, req));
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);

  interface $$Slots {
    default: {
      kind1: Nostr.Event[];
      kind6: Nostr.Event[];
      kind7: Nostr.Event[];
      kind9735: Nostr.Event[];
      status: ReqStatus;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
  //  $: console.log($status);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $status === "success" && !$data}
  {@render nodata?.()}
{:else if $data && $data?.length > 0}
  {@render children?.({
    kind1: $data
      ?.map(({ event }) => event)
      .filter(
        (event) => event.kind === 1 || event.kind === 42 || event.kind === 1111
      ),
    kind7: $data?.map(({ event }) => event).filter((event) => event.kind === 7),
    kind6: $data?.map(({ event }) => event).filter((event) => event.kind === 6),
    kind9735: $data
      ?.map(({ event }) => event)
      .filter((event) => event.kind === 9735),
    status: $status,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{/if}
