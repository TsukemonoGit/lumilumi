<script lang="ts">
  import { browser } from "$app/environment";
  import { getKind3Key } from "$lib/func/localStorageKeys";
  import { pubkeysIn } from "$lib/func/nostr";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
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
  import { onMount, untrack, type Snippet } from "svelte";
  import { type Readable } from "svelte/store";

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

  let storageKind3: Nostr.Event | undefined = $state<Nostr.Event | undefined>(
    undefined
  );
  let kind3key: string = $derived(getKind3Key(pubkey));

  onMount(() => {
    if (!browser) return;

    const stored = localStorage.getItem(kind3key);
    if (!stored) return;

    try {
      storageKind3 = JSON.parse(stored) as Nostr.Event;
    } catch (error) {
      console.error("parse error:", error);
    }
  });

  $effect(() => {
    if (!relays?.length || !$app?.rxNostr) return;

    untrack(() => {
      $app.rxNostr.setDefaultRelays(relays);
    });
  });

  let result: ReqResult<EventPacket> | undefined = $derived(
    $app?.rxNostr ? useContacts($app.rxNostr, queryKey, pubkey, req) : undefined
  );

  let data: Readable<EventPacket | null | undefined> | undefined = $derived(
    result?.data
  );
  let status: Readable<ReqStatus> | undefined = $derived(result?.status);

  let kind3Data: Nostr.Event<number> | undefined = $derived.by(() => {
    const eventData = data && $data?.event;
    if ($status === "success" || $status === "error") {
      if (eventData && eventData.created_at > (storageKind3?.created_at || 0)) {
        return eventData;
      } else {
        return storageKind3;
      }
    } else {
      //loading中はまだローカルデータをセットしない
      return undefined;
    }
  });

  $effect(() => {
    if (!kind3Data || pubkey !== lumiSetting.get().pubkey) return;

    untrack(() => {
      try {
        localStorage.setItem(kind3key, JSON.stringify(kind3Data));
        const pubkeyList = pubkeysIn(kind3Data, lumiSetting.get().pubkey);
        followList.set(pubkeyList);
      } catch (error) {
        console.error("failed to save localStorage:", error);
      }
    });
  });
</script>

{#if kind3Data}
  {@render content?.({ contacts: kind3Data, status: $status ?? "error" })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
