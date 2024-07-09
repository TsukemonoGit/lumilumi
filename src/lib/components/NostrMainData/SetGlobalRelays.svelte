<script lang="ts">
  import type { ReqStatus, RxReqBase } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import { type DefaultRelayConfig } from "rx-nostr";
  import { useGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";

  export let req: RxReqBase | undefined = undefined;

  export let pubkey: string;

  $: result = deriveResult(pubkey, req);
  $: console.log(result);
  function deriveResult(pubkey: string, req: RxReqBase | undefined) {
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
