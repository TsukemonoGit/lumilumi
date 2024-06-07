<script lang="ts">
  import { app } from "$lib/stores/stores";
  import { useContacts } from "$lib/stores/useContacts";
  import type { ReqStatus, RxReqBase } from "$lib/types";
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    AcceptableDefaultRelaysConfig,
    DefaultRelayConfig,
  } from "rx-nostr";

  export let queryKey: QueryKey;
  export let pubkey: string;
  export let req: RxReqBase | undefined = undefined;
  export let relays: DefaultRelayConfig[] | undefined = undefined;
  // TODO: Check if $app.rxNostr is defined
  if (relays && $app?.rxNostr) {
    $app?.rxNostr.setDefaultRelays(relays);
  }
  $: console.log($app?.rxNostr.getAllRelayStatus());
  $: console.log(pubkey);
  $: console.log(queryKey);
  $: console.log(req);
  $: result = $app?.rxNostr
    ? useContacts($app?.rxNostr, queryKey, pubkey, req)
    : undefined;
  $: data = result?.data;
  $: status = result?.status;
  $: error = result?.error;
  $: console.log($data);
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
