<script lang="ts">
  import { latestList } from "$lib/func/event";
  import { useReplaceableEventList } from "$lib/stores/useReplaceableEventList";
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
    pubkey: string;
    kind: number;
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
      [{ events: Nostr.Event[]; status: ReqStatus }]
    >;
  }

  const {
    req = undefined,

    queryKey,
    pubkey,
    error,
    loading,
    nodata,
    children,
    kind,
  }: Props = $props();
  //これできてないっぽい
  /*  
      latestEach((eventpacket) => {
      const tag = eventpacket.event.tags.find((tag) => tag[0] === "d");
      return tag ? tag[1] : null;
      //  import { latestList } from "$lib/func/event";でやってる
    }), */

  const result = $derived(useReplaceableEventList(queryKey, pubkey, kind, req));
  const data = $derived(result.data);
  const status = $derived(result.status);
  const errorData = $derived(result.error);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data.length > 0}
  {@render children?.({
    events: latestList($data.map(({ event }) => event)), //dごとの最新だけ残す
    status: $status,
  })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
