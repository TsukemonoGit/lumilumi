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

  const { nodata: n, loading: l, content: c }: Props = $props();

  // 基本設定のリアクティブ宣言
  const loginPubkey = $derived(lumiSetting.get().pubkey);
  const kind3key = $derived(loginPubkey ? getKind3Key(loginPubkey) : null);
  const queryKey = $derived(
    loginPubkey ? (["timeline", "contacts", loginPubkey] as const) : null
  );

  const waitOptions = {
    maxWaitTime: 5000,
    requiredConnectionRatio: 0.8,
  } as const;

  // -----------------------
  // localStorage utilities
  // -----------------------

  const isEvent = (v: unknown): v is Nostr.Event =>
    !!v && typeof v === "object" && "created_at" in v;

  const getLocalStoredEvent = (): Nostr.Event | undefined => {
    if (!browser || !kind3key) return;

    const stored = localStorage.getItem(kind3key);
    try {
      const parsed = stored ? JSON.parse(stored) : undefined;
      return isEvent(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  };

  let contacts = $state<Nostr.Event>();
  // -----------------------
  // Sync logic
  // -----------------------

  function syncWithRemote(remote: Nostr.Event) {
    if (!browser || !loginPubkey || !kind3key || !queryKey) return;
    contacts = remote;
    const local = getLocalStoredEvent();
    const isRemoteNewer = remote.created_at > (local?.created_at ?? 0);
    const latest = isRemoteNewer ? remote : local;

    if (!latest) return;

    try {
      if (isRemoteNewer) {
        localStorage.setItem(kind3key, JSON.stringify(remote));
      }

      queryClient.setQueryData(queryKey, { event: latest });
    } catch (e) {
      console.warn("Failed to update sync storage", e);
    }

    untrack(() => {
      followList.set(pubkeysIn(latest, loginPubkey));
    });
  }

  // -----------------------
  // State fallback logic
  // -----------------------
  //successででーたないときlocalのを使う
  function handleStateChange(status: ReqStatus) {
    if (contacts || status === "loading") return; //すでにセットしてたらしなくていい

    const local = getLocalStoredEvent();
    if (!local || !loginPubkey || !queryKey) return;

    queryClient.setQueryData(queryKey, { event: local });

    untrack(() => {
      followList.set(pubkeysIn(local, loginPubkey));
    });
  }
  const waitPromise = $derived(waitForConnections(waitOptions));
</script>

{#if loginPubkey && queryKey && waitPromise}
  {#await waitPromise then}
    <Contacts
      pubkey={loginPubkey}
      {queryKey}
      onchange={syncWithRemote}
      onstatechange={handleStateChange}
    >
      {#snippet loading()}
        {@render l?.()}
      {/snippet}

      {#snippet nodata()}
        {@const local = getLocalStoredEvent()}
        {#if local}
          {@render c?.({ contacts: local, status: "success" })}
        {:else}
          {@render n?.()}
        {/if}
      {/snippet}

      {#snippet content({ contacts, status })}
        {@render c?.({ contacts, status })}
      {/snippet}
    </Contacts>
  {/await}
{/if}
