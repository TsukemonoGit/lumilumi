<!--Contacts.svelte-->
<script lang="ts">
  import { app } from "$lib/stores/stores";
  import { useContacts } from "$lib/stores/useContacts";
  import type { ReqResult, ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    EventPacket,
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import { untrack, type Snippet } from "svelte";

  interface Props {
    relays?: string[];
    queryKey: QueryKey;
    pubkey: string;
    req?: RxReq<"backward"> &
      RxReqEmittable<{ relays: string[] }> &
      RxReqOverable &
      RxReqPipeable;
    nodata?: Snippet;
    loading?: Snippet;
    content?: Snippet<[{ contacts: Nostr.Event; status: ReqStatus }]>;
  }

  let {
    req = undefined,
    relays = undefined,
    queryKey,
    pubkey,
    loading,
    nodata,
    content,
  }: Props = $props();

  $effect(() => {
    if (!relays?.length || !$app?.rxNostr) return;
    untrack(() => $app.rxNostr.setDefaultRelays(relays));
  });

  let result = $derived(
    $app?.rxNostr ? useContacts($app.rxNostr, queryKey, pubkey, req) : undefined
  );

  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let contactsEvent = $derived(data && $data?.event);
  //$inspect($app?.rxNostr, $data);
  // コンソールログ削除
</script>

{#if contactsEvent}
  {@render content?.({ contacts: contactsEvent, status: $status ?? "error" })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
