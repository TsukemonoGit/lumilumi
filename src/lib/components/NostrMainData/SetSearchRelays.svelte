<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { useGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import type { ReqResult, ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { untrack } from "svelte";

  // export let req:
  //   | (RxReq<"backward"> &
  //       RxReqEmittable<{
  //         relays: string[];
  //       }> &
  //       RxReqOverable &
  //       RxReqPipeable)
  //   | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
  //   | undefined = undefined;

  // export let pubkey: string;
  interface Props {
    pubkey: string;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    relayChange: (data: string[]) => void;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    children?: import("svelte").Snippet<
      [{ relays: string[]; status: ReqStatus }]
    >;
  }
  let {
    req = undefined,
    pubkey,
    relayChange,
    error,
    loading,
    nodata,
    children,
  }: Props = $props();
  // Create event dispatcher
  // const dispatch = createEventDispatcher();

  let result = deriveResult(pubkey, req);

  function deriveResult(
    pubkey: string,
    req:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined
  ): ReqResult<string[]> {
    return useGlobalRelaySet(
      ["searchRelay", pubkey],
      [{ authors: [pubkey], kinds: [10007], limit: 1 }] as Nostr.Filter[],
      req
    );
  }

  // Reactive variables for result data, status, and error
  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let errorData = $derived(result?.error);

  // When relays data is available, dispatch 'relayChange' event
  $effect(() => {
    if ($data) {
      untrack(() => dataChange($data));
    }
  });
  function dataChange(data: string[] | null | undefined) {
    if (data && data.length > 0) {
      console.log(data);
      relayChange(data);
    }
  }
  // data?.subscribe((value) => {
  //   if (value && value.length > 0) {
  //     console.log(value);
  //     relayChange(value);
  //   }
  // });

  interface $$Slots {
    default: {
      relays: string[];
      status: ReqStatus;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

<!-- Slot management based on data, status, and error -->
{#if $errorData}
  {@render error?.($errorData)}
{:else if $data && $data.length > 0}
  <!-- Pass the relays and status via default slot -->
  {@render children?.({ relays: $data, status: $status ?? "error" })}
  <!-- <slot relays={$data} status={$status ?? "error"} /> -->
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
