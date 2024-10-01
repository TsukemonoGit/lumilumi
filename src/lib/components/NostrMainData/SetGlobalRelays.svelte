<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
  } from "rx-nostr";
  import { useGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import { createEventDispatcher } from "svelte";

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
  $: console.log(result);
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
      ["globalRelay", pubkey],
      [
        { authors: [pubkey], kinds: [30002], "#d": ["global"], limit: 1 },
      ] as Nostr.Filter[],
      req
    );
  }

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

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

{#if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <slot relays={$data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
