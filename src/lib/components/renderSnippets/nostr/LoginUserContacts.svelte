<script lang="ts">
  import { browser } from "$app/environment";
  import { untrack, type Snippet } from "svelte";
  import { getKind3Key } from "$lib/func/localStorageKeys";
  import { pubkeysIn } from "$lib/func/nostr";
  import {
    followList,
    lumiSetting,
    relayConnectionState,
  } from "$lib/stores/globalRunes.svelte";
  import type { ReqStatus } from "$lib/types";
  import type Nostr from "nostr-typedef";
  import Contacts from "./Contacts.svelte";
  import { queryClient } from "$lib/stores/stores";
  import { formatToEventPacket } from "$lib/func/util";

  interface Props {
    nodata?: Snippet;
    loading?: Snippet;
    content?: Snippet<[{ contacts: Nostr.Event; status: ReqStatus }]>;
  }

  let { nodata: n, loading: l, content: c }: Props = $props();

  let loginPubkey = $derived(lumiSetting.value.pubkey);
  let kind3key = $derived(loginPubkey ? getKind3Key(loginPubkey) : null);

  let queryKey = $derived(
    loginPubkey ? ["naddr", `${3}:${loginPubkey}:`] : null,
  );
  let isRelayReady = $derived(relayConnectionState.ready);

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
  let resolvedStatus = $state<ReqStatus>("loading");

  function syncWithRemote(remote: Nostr.Event) {
    if (!browser || !loginPubkey || !kind3key || !queryKey) return;
    contacts = remote;
    resolvedStatus = "success";

    const local = getLocalStoredEvent();
    const isRemoteNewer = remote.created_at > (local?.created_at ?? 0);
    const latest = isRemoteNewer ? remote : local;

    if (!latest) return;

    try {
      if (isRemoteNewer) {
        localStorage.setItem(kind3key, JSON.stringify(remote));
      }

      queryClient.setQueryData(queryKey, (oldData: any) =>
        formatToEventPacket(latest),
      );
    } catch (e) {
      console.warn("Failed to update sync storage", e);
    }

    untrack(() => {
      followList.set(pubkeysIn(latest, loginPubkey));
    });
  }

  function handleStateChange(status: ReqStatus) {
    if (contacts) {
      resolvedStatus = status;
      return;
    }

    if (status === "loading") {
      resolvedStatus = "loading";
      return;
    }

    const local = getLocalStoredEvent();
    if (local && loginPubkey && queryKey) {
      contacts = local;
      resolvedStatus = "success";

      queryClient.setQueryData(queryKey, (oldData: any) =>
        formatToEventPacket(local),
      );

      untrack(() => {
        followList.set(pubkeysIn(local, loginPubkey));
      });
      return;
    }

    resolvedStatus = "error";
  }
</script>

{#if loginPubkey && queryKey}
  {#if isRelayReady}
    <Contacts
      pubkey={loginPubkey}
      onchange={syncWithRemote}
      onstatechange={handleStateChange}
    >
      {#snippet loading()}{/snippet}
      {#snippet nodata()}{/snippet}
      {#snippet content()}{/snippet}
    </Contacts>
  {/if}

  {#if !isRelayReady}
    {@render l?.()}
  {:else if resolvedStatus === "loading" && !contacts}
    {@render l?.()}
  {:else if contacts}
    {@render c?.({ contacts, status: resolvedStatus })}
  {:else}
    {@render n?.()}
  {/if}
{/if}
