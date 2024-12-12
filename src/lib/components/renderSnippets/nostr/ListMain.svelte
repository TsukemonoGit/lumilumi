<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
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

  let {
    req = undefined,

    queryKey,
    pubkey,
    error,
    loading,
    nodata,
    children,
  }: Props = $props();

  let result = $derived(useReplaceableEventList(queryKey, pubkey, 30000, req));
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data.length > 0}
  {@render children?.({
    events: $data.map(({ event }) => event),
    status: $status,
  })}
  <!-- <slot events={$data.map(({ event }) => event)} status={$status} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
