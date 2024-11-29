<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
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
  }
  let {
    req = undefined,
    relays = undefined,
    queryKey,
    filters,
    error,
    loading,
    nodata,
    children,
  }: Props = $props();
  // export let req:
  // export let relays: string[] | undefined = undefined;
  // export let queryKey: QueryKey;
  // export let filters: Nostr.Filter[];
  // export let req:
  //   | (RxReq<"backward"> &
  //       RxReqEmittable<{
  //         relays: string[];
  //       }> &
  //       RxReqOverable &
  //       RxReqPipeable)
  //   | undefined = undefined;
  let max3relays = $derived(relays ? relays.slice(0, 3) : undefined);
  let result = $derived(useLatestEvent(queryKey, filters, req, max3relays));
  let data = $derived(result.data);
  let status = $derived(result.status);
  let errorData = $derived(result.error);
  interface $$Slots {
    default: { event: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
  //$: console.log(queryKey, $data, $status, relays);
</script>

{#if $errorData}
  {@render error?.($errorData)}
  <!-- <slot name="error" error={$error} /> -->
{:else if $status === "success" && !$data}
  {@render nodata?.()}
  <!-- <slot name="nodata" /> -->
{:else if $data && $data.event}
  {@render children?.({ event: $data.event, status: $status })}
  <!-- <slot event={$data.event} status={$status} /> -->
{:else}
  {@render loading?.()}
  <!-- <slot name="loading" /> -->
{/if}
