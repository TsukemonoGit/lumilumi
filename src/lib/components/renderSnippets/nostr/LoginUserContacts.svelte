<script lang="ts">
    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    import { getKind3Key } from "$lib/func/localStorageKeys";
    import { pubkeysIn } from "$lib/func/nostr";
    import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
    import { app } from "$lib/stores/stores";
    import { useContacts } from "$lib/stores/useContacts";
    import type { EventPacket } from "rx-nostr";
    import { waitForConnections } from "./timelineList";

    let { children } = $props();
    // --------------------------------------------------------------------------
    // state
    // --------------------------------------------------------------------------
    let loginPubkey = $derived(lumiSetting.get().pubkey);
    let kind3key = $derived(loginPubkey ? getKind3Key(loginPubkey) : "");

    let storageKind3 = $state<EventPacket["event"] | undefined>(undefined);

    // relay 接続待ち完了フラグ
    let relayReady = $state(false);

    // Kind3 取得完了フラグ
    let kind3Ready = $state(false);

    // --------------------------------------------------------------------------
    // mount
    // --------------------------------------------------------------------------
    onMount(async () => {
        if (!browser) return;

        // relay 接続待ち
        try {
            await waitForConnections({
                maxWaitTime: 5000,
                requiredConnectionRatio: 0.8,
            });
            relayReady = true;
        } catch {
            // タイムアウトしても処理を進める
            relayReady = true;
        }

        // localStorage 読み込み
        if (!kind3key) return;

        const stored = localStorage.getItem(kind3key);
        if (!stored) return;

        try {
            storageKind3 = JSON.parse(stored) as EventPacket["event"];
        } catch {
            return;
        }

        if (storageKind3) {
            const pubkeyList = pubkeysIn(storageKind3, loginPubkey);
            followList.set(pubkeyList);
            kind3Ready = true;
        }
    });

    // --------------------------------------------------------------------------
    // Contacts 取得（relayReady が true になるまで起動しない）
    // --------------------------------------------------------------------------
    let contactsResult = $derived(
        relayReady && $app?.rxNostr && loginPubkey
            ? useContacts(
                  $app.rxNostr,
                  ["timeline", "contacts", loginPubkey],
                  loginPubkey,
              )
            : undefined,
    );

    let contactsData = $derived(contactsResult?.data);
    let contactsEvent = $derived(
        contactsData ? $contactsData?.event : undefined,
    );

    // --------------------------------------------------------------------------
    // 最新データの保存・反映
    // --------------------------------------------------------------------------
    $effect(() => {
        if (!contactsEvent || !loginPubkey || !kind3key) return;

        if (
            !storageKind3 ||
            contactsEvent.created_at > storageKind3.created_at
        ) {
            try {
                localStorage.setItem(kind3key, JSON.stringify(contactsEvent));
                storageKind3 = contactsEvent;

                const pubkeyList = pubkeysIn(contactsEvent, loginPubkey);
                followList.set(pubkeyList);

                kind3Ready = true;
            } catch {
                // noop
            }
        }
    });
</script>

{#if relayReady || !kind3key}<!--ログインしてなくても閲覧できる-->
    {@render children?.()}
{/if}
