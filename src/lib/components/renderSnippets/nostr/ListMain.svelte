<script lang="ts">
  import { latestList } from "#lib/func/event.ts";
  import { useReplaceableEventList } from "#lib/stores/useReplaceableEventList.ts";
  import type { ReqStatus } from "#lib/types.ts";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";

  import type { Snippet } from "svelte";

  interface Props {
    queryKey: QueryKey;
    pubkey: string;
    kind: number;

    error?: Snippet<[Error]>;
    nodata?: Snippet;
    loading?: Snippet;

    children?: Snippet<[{ events: Nostr.Event[]; status: ReqStatus }]>;
  }

  let { queryKey, pubkey, error, loading, nodata, children, kind }: Props =
    $props();
  //これできてないっぽい
  /*  
      latestEach((eventpacket) => {
      const tag = eventpacket.event.tags.find((tag) => tag[0] === "d");
      return tag ? tag[1] : null;
      //  import { latestList } from "#lib/func/event.ts";でやってる
    }), */

  let result = $derived(useReplaceableEventList(queryKey, pubkey, kind));
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
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
