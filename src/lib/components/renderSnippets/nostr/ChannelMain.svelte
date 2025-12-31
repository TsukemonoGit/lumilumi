<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { app } from "$lib/stores/stores";
  import { useReplaceableEvent } from "$lib/stores/useReplaceableEvent";
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
    pubkey: string;
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

    children?: Snippet<[{ event: Nostr.Event; status: ReqStatus }]>;
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

  let result = $derived(
    useReplaceableEvent($app?.rxNostr, queryKey, pubkey, 10005, req)
  );
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if $data}
  {@render children?.({ event: $data.event, status: $status })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
