<script lang="ts">
  import { browser } from "$app/environment";
  import { untrack, type Snippet } from "svelte";
  import { getKind3Key } from "$lib/func/localStorageKeys";
  import { pubkeysIn } from "$lib/func/nostr";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import type { ReqStatus } from "$lib/types";
  import type Nostr from "nostr-typedef";
  import { waitForConnections } from "./timelineList";
  import Contacts from "./Contacts.svelte";
  import { queryClient } from "$lib/stores/stores";

  interface Props {
    nodata?: Snippet;
    loading?: Snippet;
    content?: Snippet<[{ contacts: Nostr.Event; status: ReqStatus }]>;
  }

  let { nodata: n, loading: l, content: c }: Props = $props();

  let loginPubkey = $derived(lumiSetting.get().pubkey);
  let kind3key = $derived(loginPubkey ? getKind3Key(loginPubkey) : "");
  let queryKey = $derived(["timeline", "contacts", loginPubkey]);

  // ローカルキャッシュを取得するヘルパー
  function getLocalStoredEvent(): Nostr.Event | undefined {
    if (!browser || !kind3key) return undefined;
    const stored = localStorage.getItem(kind3key);
    try {
      return stored ? JSON.parse(stored) : undefined;
    } catch {
      return undefined;
    }
  }

  // 取得したイベントを同期する関数
  function handleSync(event: Nostr.Event) {
    if (!browser || !event || !loginPubkey || !kind3key) return;

    const storedEvent = getLocalStoredEvent();
    const storageCreatedAt = storedEvent?.created_at ?? 0;

    // 1. 最新のイベントはどちらかを判定
    const isRemoteNewer = event.created_at > storageCreatedAt;
    const latestEvent = isRemoteNewer ? event : storedEvent;

    if (!latestEvent) return; // 万が一どちらも存在しない場合のガード

    // 2. リレーから来たイベントの方が新しい場合のみ、ストレージ類を更新
    if (isRemoteNewer) {
      try {
        localStorage.setItem(kind3key, JSON.stringify(event));
        queryClient.setQueryData(queryKey, { event });
      } catch (e) {
        console.warn("Failed to update localStorage", e);
      }
    }

    // 3. 最終的に「最新である」と判定された方でリストを更新
    // リレーが新しければ event、ローカルが新しければ storedEvent が入る
    untrack(() => {
      followList.set(pubkeysIn(latestEvent, loginPubkey));
    });
  }
</script>

{#if loginPubkey}
  {#await waitForConnections( { maxWaitTime: 5000, requiredConnectionRatio: 0.8 } ) then}
    <Contacts pubkey={loginPubkey} {queryKey}>
      {#snippet nodata()}
        {@const localEvent = getLocalStoredEvent()}
        {#if localEvent}
          {handleSync(localEvent)}
          {@render c?.({ contacts: localEvent, status: "success" })}
        {:else}
          {@render n?.()}
        {/if}
      {/snippet}

      {#snippet loading()}
        {@render l?.()}
      {/snippet}

      {#snippet content({ contacts, status })}
        {@const _ = handleSync(contacts)}
        {@render c?.({ contacts, status })}
      {/snippet}
    </Contacts>
  {/await}
{/if}
