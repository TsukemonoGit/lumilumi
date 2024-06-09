<script lang="ts">
  import { setRelays, setRxNostr } from "$lib/func/nostr";
  import { app } from "$lib/stores/stores";
  import { useRelaySet } from "$lib/stores/useRelaySet";
  import type { ReqResult, ReqStatus, RxReqBase } from "$lib/types";
  import { get, writable, readable } from "svelte/store";
  import type Nostr from "nostr-typedef";
  import { type DefaultRelayConfig } from "rx-nostr";
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { relaySearchRelays } from "$lib/stores/relays";

  export let req: RxReqBase | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;

  const STORAGE_KEY = "relaySettings";
  let localRelays: DefaultRelayConfig[] | undefined = undefined;
  let pubkey: string = "";

  onMount(() => {
    initializeRxNostr();
    const savedSettings = loadSettingsFromLocalStorage();
    if (savedSettings) {
      applySavedSettings(savedSettings);
    } else {
      goto("/settings");
    }
  });

  function initializeRxNostr() {
    if (!$app?.rxNostr) {
      setRxNostr();
    }
  }

  function loadSettingsFromLocalStorage() {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    console.log(savedSettings);
    return savedSettings ? JSON.parse(savedSettings) : null;
  }

  function applySavedSettings(settings: {
    relays: DefaultRelayConfig[];
    useRelaySet: string;
    pubkey: string;
  }) {
    const {
      relays: savedRelays,
      useRelaySet: savedRelaySet,
      pubkey: savedPubkey,
    } = settings;
    console.log(savedRelays);
    if (savedRelaySet === "1" && savedRelays.length > 0) {
      localRelays = savedRelays;
      setRelays(localRelays as DefaultRelayConfig[]);
    } else {
      localRelays = [];
      setRelays(relaySearchRelays);
    }
    pubkey = savedPubkey;
  }

  $: console.log(localRelays !== undefined);
  $: console.log(localRelays !== undefined && $app?.rxNostr);

  $: result = deriveResult(localRelays, pubkey, req);

  function deriveResult(
    localRelays: DefaultRelayConfig[] | undefined,
    pubkey: string,
    req: RxReqBase | undefined
  ) {
    if (localRelays !== undefined) {
      if (localRelays.length <= 0 && $app?.rxNostr) {
        return useRelaySet(
          ["defaultRelay", pubkey],
          [
            { authors: [pubkey], kinds: [3, 10002], limit: 1 },
          ] as Nostr.Filter[],
          req
        );
      } else if (localRelays.length > 0) {
        return {
          data: readable(localRelays),
          status: readable("success" as ReqStatus),
          error: readable(undefined),
        };
      }
    }
    return undefined;
  }

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;
  $: console.log($data);
  interface $$Slots {
    default: {
      relays: DefaultRelayConfig[];
      status: ReqStatus;
      pubkey: string;
    };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if relays}
  <slot {relays} status="success" {pubkey} />
{:else if $error}
  <slot name="error" error={$error} />
{:else if $data && $data.length > 0}
  <slot relays={localRelays ?? $data} status={$status ?? "error"} {pubkey} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
