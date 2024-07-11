<script lang="ts">
  import { app } from "$lib/stores/stores";
  import { useContacts } from "$lib/stores/useContacts";
  import type { ReqStatus, RxReqBase } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    DefaultRelayConfig,
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";

  export let queryKey: QueryKey;
  export let pubkey: string;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | (RxReq<"forward"> & RxReqEmittable & RxReqPipeable)
    | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;
  // TODO: Check if $app.rxNostr is defined
  if (relays && relays.length > 0 && $app?.rxNostr) {
    $app?.rxNostr.setDefaultRelays(relays);
  }

  $: result = $app?.rxNostr
    ? useContacts($app?.rxNostr, queryKey, pubkey, req)
    : undefined;
  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface $$Slots {
    default: { contacts: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if $data}
  <slot contacts={$data?.event} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
