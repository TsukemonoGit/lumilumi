<script lang="ts">
  import { useGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import type { ReqStatus } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  import type Nostr from "nostr-typedef";
  import {
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";

  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined = undefined;

  export let pubkey: string;

  // Create event dispatcher
  const dispatch = createEventDispatcher();

  $: result = deriveResult(pubkey, req);

  function deriveResult(
    pubkey: string,
    req:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
      | undefined
  ) {
    return useGlobalRelaySet(
      ["searchRelay", pubkey],
      [{ authors: [pubkey], kinds: [10007], limit: 1 }] as Nostr.Filter[],
      req
    );
  }

  // Reactive variables for result data, status, and error
  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  // When relays data is available, dispatch 'relayChange' event
  $: if ($data && $data.length > 0) {
    console.log($data);
    dispatch("relayChange", { relays: $data });
  }

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
{#if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <!-- Pass the relays and status via default slot -->
  <slot relays={$data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
