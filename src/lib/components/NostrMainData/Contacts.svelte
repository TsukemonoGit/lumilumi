<script lang="ts">
  import { browser } from "$app/environment";
  import { app } from "$lib/stores/stores";
  import { useContacts } from "$lib/stores/useContacts";
  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    DefaultRelayConfig,
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import { onMount } from "svelte";

  export let queryKey: QueryKey;
  export let pubkey: string;
  export let req:
    | (RxReq<"backward"> &
        RxReqEmittable<{
          relays: string[];
        }> &
        RxReqOverable &
        RxReqPipeable)
    | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;

  let storageKind3: Nostr.Event;

  let kind3key = `kind3-${pubkey}`; // New format by pubkey
  let oldKind3key = "kind3";
  onMount(() => {
    if (browser) {
      const tmp = localStorage.getItem(kind3key);
      if (tmp) {
        try {
          storageKind3 = JSON.parse(tmp) as Nostr.Event;
        } catch (error) {
          console.log("parse error");
        }
      }

      //旧形式のデータを削除
      const oldTmp = localStorage.getItem(oldKind3key);
      if (oldTmp) {
        localStorage.removeItem(oldKind3key);
      }
    }
  });
  let kind3Data: Nostr.Event;
  if (relays && relays.length > 0 && $app?.rxNostr) {
    $app?.rxNostr.setDefaultRelays(relays);
  }

  $: result = $app?.rxNostr
    ? useContacts($app?.rxNostr, queryKey, pubkey, req)
    : undefined;

  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;
  $: if (data && $data) {
    if (storageKind3 && storageKind3.created_at > $data.event.created_at) {
      kind3Data = storageKind3;
    } else if ($data.event) {
      kind3Data = $data.event;
      localStorage.setItem(kind3key, JSON.stringify(kind3Data));
    }
  }

  interface $$Slots {
    default: { contacts: Nostr.Event; status: ReqStatus };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if $error}
  <slot name="error" error={$error} />
{:else if kind3Data}
  <slot contacts={kind3Data} status={$status ?? "error"} />
{:else if $status === "loading"}
  <slot name="loading" />
{:else}
  <slot name="nodata" />
{/if}
