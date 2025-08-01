<!-- @migration-task Error while migrating Svelte code: This migration would change the name of a slot making the component unusable -->
<script lang="ts">
  import { browser } from "$app/environment";
  import { pubkeysIn } from "$lib/func/nostr";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { app } from "$lib/stores/stores";
  import { useContacts } from "$lib/stores/useContacts";
  import type { ReqStatus } from "$lib/types";

  import type { QueryKey } from "@tanstack/svelte-query";
  import type Nostr from "nostr-typedef";
  import type {
    RxReq,
    RxReqEmittable,
    RxReqOverable,
    RxReqPipeable,
  } from "rx-nostr";
  import { onMount, untrack } from "svelte";

  interface Props {
    relays?: string[] | undefined;
    queryKey: QueryKey;
    pubkey: string;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: import("svelte").Snippet<[Error]>;
    nodata?: import("svelte").Snippet;
    loading?: import("svelte").Snippet;

    content?: import("svelte").Snippet<
      [{ contacts: Nostr.Event; status: ReqStatus }]
    >;
  }

  let {
    req = undefined,
    relays = undefined,
    queryKey,
    pubkey,
    error,
    loading,
    nodata,
    content,
  }: Props = $props();

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

  if (relays && relays.length > 0 && $app?.rxNostr) {
    $app?.rxNostr.setDefaultRelays(relays);
  }

  let result = $derived(
    $app?.rxNostr
      ? useContacts($app?.rxNostr, queryKey, pubkey, req)
      : undefined
  );

  let data = $derived(result?.data);
  let status = $derived(result?.status);
  let errorData = $derived(result?.error);

  let kind3Data: Nostr.Event | undefined = $derived.by(() => {
    if (data && $data) {
      if (storageKind3 && storageKind3.created_at > $data.event.created_at) {
        return storageKind3;
      } else if ($data.event) {
        return $data.event;
      }
    }
    return undefined;
  });

  $effect(() => {
    if (kind3Data && pubkey === lumiSetting.get().pubkey) {
      untrack(() => {
        try {
          localStorage.setItem(kind3key, JSON.stringify(kind3Data));
        } catch (error) {
          console.log("failed to save localStorage");
        }
        const pubkeyList = pubkeysIn(kind3Data, lumiSetting.get().pubkey);
        followList.set(pubkeyList);
      });
    }
  });
</script>

{#if $errorData}
  {@render error?.($errorData)}
{:else if kind3Data}
  {@render content?.({ contacts: kind3Data, status: $status ?? "error" })}
{:else if $status === "loading"}
  {@render loading?.()}
{:else}
  {@render nodata?.()}
{/if}
