<script lang="ts">
  import { setRelays, setRxNostr } from "$lib/func/nostr";
  import { app } from "$lib/stores/stores";

  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type Nostr from "nostr-typedef";
  import { type DefaultRelayConfig } from "rx-nostr";

  export let pubkey: string;
  export let req: RxReqBase | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;
  $: if (!$app?.rxNostr && typeof window !== "undefined") {
    setRxNostr();
    console.log($app.rxNostr);
  }

  $: result =
    !relays && $app?.rxNostr
      ? useRelaySet(
          $app.rxNostr,
          ["defaultRelay", pubkey],
          [
            { authors: [pubkey], kinds: [3, 10002], limit: 1 },
          ] as Nostr.Filter[],
          req
        )
      : undefined;
  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

  $: if ($data && $data.length > 0) {
    setRelays($data);
    //console.log(data);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  <slot {relays} status={"success"} />
{:else if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <slot relays={$data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
