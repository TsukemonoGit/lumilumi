<!--Contacts.svelte-->
<script lang="ts">
  import { app } from "$lib/stores/stores";
  import { useContacts } from "$lib/stores/useContacts";
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import { untrack, type Snippet } from "svelte";

  interface Props {
    relays?: string[];

    pubkey: string;
    req?: RxReq<"backward"> &
      RxReqEmittable<{ relays: string[] }> &
      RxReqOverable &
      RxReqPipeable;
    nodata?: Snippet;
    loading?: Snippet;
    content?: Snippet<[{ contacts: Nostr.Event; status: ReqStatus }]>;
    onchange?: (contacts: Nostr.Event) => void;
    onstatechange?: (
      status: ReqStatus,
      contacts: Nostr.Event | undefined,
    ) => void;
  }

  let {
    req = undefined,
    relays = undefined,

    pubkey,
    loading,
    nodata,
    content,
    onchange,
    onstatechange,
  }: Props = $props();
  let queryKey = $derived(["naddr", `${3}:${pubkey}:`]);

  $effect(() => {
    if (!relays?.length || !$app?.rxNostr) return;
    untrack(() => $app.rxNostr.setDefaultRelays(relays));
  });

  let result = $derived(
    $app?.rxNostr
      ? useContacts($app.rxNostr, queryKey, pubkey, req)
      : undefined,
  );
  $effect(() => {
    const currentResult = result;
    return () => currentResult?.destroy();
  });
  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let contactsEvent = $derived(data && $data?.event);
  //$inspect($app?.rxNostr, $data);
  // コンソールログ削除

  $effect(() => {
    if (contactsEvent) {
      untrack(() => {
        onchange?.(contactsEvent);
      });
    }
  });
  $effect(() => {
    if ($status) {
      untrack(() => {
        onstatechange?.($status, contactsEvent);
      });
    }
  });
</script>

{#if contactsEvent}
  {@render content?.({ contacts: contactsEvent, status: $status ?? "error" })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
