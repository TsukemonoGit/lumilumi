<script lang="ts">
  import { browser } from "$app/environment";
  import { onMount, type Snippet } from "svelte";
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

  let relayReady = $state(false);

  onMount(async () => {
    if (!browser) return;
    try {
      await waitForConnections({
        maxWaitTime: 5000,
        requiredConnectionRatio: 0.8,
      });
    } finally {
      relayReady = true;
    }
  });

  // --------------------------------------------------------------------------
  // handleSync: リレーからデータが届いた時のみ実行
  // --------------------------------------------------------------------------
  function handleSync(event: Nostr.Event) {
    if (!browser || !event || !loginPubkey || !kind3key) return;

    // 1. localStorage から現在のキャッシュを取得（比較用）
    const stored = localStorage.getItem(kind3key);
    let storageCreatedAt = 0;

    if (stored) {
      try {
        storageCreatedAt = JSON.parse(stored).created_at;
      } catch {
        storageCreatedAt = 0;
      }
    }

    // 2. 届いたイベントがキャッシュより新しい場合のみ更新
    if (event.created_at > storageCreatedAt) {
      try {
        // 保存
        localStorage.setItem(kind3key, JSON.stringify(event));

        // TanStack Query のキャッシュを直接書き換える
        queryClient.setQueryData(queryKey, { event });

        // グローバルなフォローリストを更新（これによってタイムラインのフィルタが動く）
        followList.set(pubkeysIn(event, loginPubkey));
      } catch (e) {
        console.warn("Failed to sync login user contacts", e);
      }
    }
  }
</script>

{#if loginPubkey && relayReady}
  <Contacts pubkey={loginPubkey} {queryKey}>
    {#snippet nodata()}
      {@render n?.()}
    {/snippet}

    {#snippet loading()}
      {@render l?.()}
    {/snippet}

    {#snippet content({ contacts, status })}
      {@const _ = handleSync(contacts)}

      {@render c?.({ contacts, status })}
    {/snippet}
  </Contacts>
{/if}
