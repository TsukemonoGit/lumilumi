<script lang="ts">
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  import { readable } from "svelte/store";
  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
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
  let relays: DefaultRelayConfig[] | undefined = undefined;

  export let localRelays: DefaultRelayConfig[];
  export let pubkey: string;

  $: result = deriveResult(localRelays, pubkey, req);

  function deriveResult(
    localRelays: DefaultRelayConfig[],
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
    if (!localRelays || localRelays.length <= 0) {
      return useRelaySet(
        ["defaultRelay", pubkey],
        [
          // { authors: [pubkey], kinds: [3], limit: 1 },
          { authors: [pubkey], kinds: [10002], limit: 1 },
        ] as Nostr.Filter[],
        req
      );
    } else {
      return {
        data: readable(localRelays),
        status: readable("success" as ReqStatus),
        error: readable(undefined),
      };
    }
  }

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  interface $$Slots {
    default: {
      relays: DefaultRelayConfig[];
      status: ReqStatus;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if relays}
  <slot {relays} status="success" />
{:else if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <slot relays={localRelays ?? $data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
