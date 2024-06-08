<script lang="ts">
  import { setRelays, setRxNostr } from "$lib/func/nostr";
  import { app } from "$lib/stores/stores";

  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqResult, ReqStatus, RxReqBase } from "$lib/types";
  import { get, writable, readable } from "svelte/store";
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type Nostr from "nostr-typedef";
  import { type DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";
  export let pubkey: string;
  export let req: RxReqBase | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;

  const STORAGE_KEY = "relaySettings";
  let localRelays: DefaultRelayConfig[] | undefined = undefined;
  onMount(() => {
    if (!$app?.rxNostr) {
      setRxNostr();
    }
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    console.log(savedSettings);
    if (savedSettings) {
      const { relays: savedRelays, useRelaySet: savedRelaySet } =
        JSON.parse(savedSettings);
      console.log(savedRelays);
      if (savedRelaySet === "1" && savedRelays.length > 0) {
        //0が10002か3、１がlocal
        localRelays = savedRelays;
        setRelays(localRelays as DefaultRelayConfig[]);
      }
    } else {
      return [];
    }
  });
  $: console.log(localRelays !== undefined && $app?.rxNostr);
  $: result =
    localRelays !== undefined && localRelays.length <= 0 && $app?.rxNostr
      ? useRelaySet(
          $app.rxNostr,
          ["defaultRelay", pubkey],
          [
            { authors: [pubkey], kinds: [3, 10002], limit: 1 },
          ] as Nostr.Filter[],
          req
        )
      : localRelays !== undefined && localRelays.length > 0
        ? {
            data: readable(localRelays),
            status: readable("success" as ReqStatus),
            error: readable(undefined),
          }
        : undefined;
  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;

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
  <slot relays={localRelays ?? $data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
