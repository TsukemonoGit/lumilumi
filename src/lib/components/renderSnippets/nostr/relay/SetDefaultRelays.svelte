<!--SetDefaultRelays.svelte-->
<script lang="ts">
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
    type EventPacket,
    latest,
    uniq,
  } from "rx-nostr";
  import { pipe } from "rxjs";
  import {
    getDefaultWriteRelays,
    setRelays,
    usePromiseReq,
  } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/relays";
  import { defaultRelays as defo, queryClient } from "$lib/stores/stores";

  import { browser } from "$app/environment";
  import { getKind10002Key } from "$lib/func/localStorageKeys";

  import {
    lumiSetting,
    relayConnectionState,
  } from "$lib/stores/globalRunes.svelte";
  import { untrack, type Snippet } from "svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";

  import { get } from "svelte/store";
  import { normalizeURL } from "nostr-tools/utils";
  import { scanArray } from "$lib/stores/operators";

  interface Props {
    paramRelays: string[] | undefined;
    error?: Snippet<[Error]>;
    loading?: Snippet<[string]>;
    contents?: Snippet;
  }

  let { paramRelays = undefined, error, loading, contents }: Props = $props();

  const pubkey = lumiSetting.value.pubkey;
  const queryKey = ["naddr", `10002:${pubkey}:`];
  const filters: Nostr.Filter[] = [
    { authors: [pubkey], kinds: [10002], limit: 1 },
  ];

  let status: ReqStatus | undefined = $state();
  let loadingMessage: string = $state("connectingRelay.establishing");
  let mainRelaysInitialized = $state(false);

  // --- ヘルパー関数 ---

  function mergeRelays(readEntries: string[], writeRelays: string[]) {
    const merged = new Map<string, DefaultRelayConfig>();

    const upsert = (entry: string, flag: "read" | "write") => {
      const nurl = normalizeURL(entry);
      const existing = merged.get(nurl);
      if (existing) {
        existing[flag] = true;
      } else {
        merged.set(nurl, {
          url: nurl,
          read: flag === "read",
          write: flag === "write",
        });
      }
    };

    readEntries.forEach((entry) => upsert(entry, "read"));
    writeRelays.forEach((entry) => upsert(entry, "write"));

    setRelays(Object.fromEntries(merged));
  }

  /** リレーを適用し、接続を待機 */
  async function applyRelays(): Promise<void> {
    relayConnectionState.setReady(true);
    const currentReadRelays = Object.fromEntries(
      Object.entries(get(defo) ?? {}).filter(
        ([_, config]) => config.read === true,
      ),
    );

    await waitForConnections({
      checkrelays: currentReadRelays,
      requiredConnectionRatio: 0.5,
      onProgress: (connected, total) => {
        console.debug(`relay connection progress: ${connected}/${total}`);
      },
    });
  }

  /** 成功状態に移行 */
  function setSuccess(): void {
    status = "success";
    mainRelaysInitialized = true;
  }

  /** エラー状態に移行 */
  function setError(): void {
    status = "error";
  }

  /** kind:10002をlocalStorageに保存する */
  function saveLocal10002(event: Nostr.Event): void {
    if (!browser || !pubkey) return;
    try {
      localStorage.setItem(getKind10002Key(pubkey), JSON.stringify(event));
    } catch (e) {
      console.warn("Failed to save kind:10002 to localStorage:", e);
    }
  }

  /** kind:10002をフェッチ（常時ネットワーク取得、cache/localStorageと比較して最新を使用） */
  async function fetchKind10002() {
    // 1. フォールバック候補を事前読み込み
    const rawCache: EventPacket | undefined | null =
      queryClient.getQueryData(queryKey);
    const cachedData =
      rawCache?.event?.kind === 10002 && rawCache.event.pubkey === pubkey
        ? rawCache
        : undefined;
    console.log(cachedData);
    if (cachedData) {
      setRelays(cachedData.event.tags);
    }
    //あればセット
    //あってもなくてもフェッチ
    try {
      await usePromiseReq(
        { filters, operator: pipe(uniq(), latest(), scanArray()) },
        defaultRelays,
        3000,
        (packets: EventPacket[]) => {
          console.log(packets);
          if (
            packets.length > 0 &&
            (!cachedData ||
              packets[0].event.created_at > cachedData.event.created_at)
          ) {
            //新しいでーたがあればそれをセット、保存
            queryClient.setQueryData(queryKey, packets[0]);
            setRelays(packets[0].event.tags);
            saveLocal10002(packets[0].event);
          }
        },
      );
    } catch (e) {
      console.warn("kind:10002 fetch failed:", e);
    }

    if (!queryClient.getQueryData(queryKey)) {
      setRelays(defaultRelays);
    }
  }

  // --- paramRelaysあり: paramRelaysをread用、10002のwriteをマージ ---
  async function initWithParamRelays(paramRelays: string[]): Promise<void> {
    status = "loading";

    if (!pubkey) {
      setRelays(paramRelays);
      await applyRelays();
      setSuccess();
      return;
    }

    if (lumiSetting.value.useRelaySet === "0") {
      try {
        await fetchKind10002();
      } catch (e) {
        console.warn(
          "kind:10002 fetch failed, proceeding without write relays",
          e,
        );
      }
    } else {
      setRelays(lumiSetting.value.relays as DefaultRelayConfig[]);
    }

    const merged = mergeRelays(paramRelays, getDefaultWriteRelays());

    console.log("merged before applyRelays:", merged);

    try {
      await applyRelays();
      setSuccess();
    } catch (e) {
      setError();
    }
  }

  // --- paramRelaysなし: kind:10002またはsettingsからリレーをセット ---
  async function initWithDefaultRelays(): Promise<void> {
    if (!pubkey) {
      try {
        await applyRelays();
        setSuccess();
      } catch (e) {
        setError();
      }
      return;
    }

    status = "loading";

    if (lumiSetting.value.useRelaySet !== "0") {
      try {
        setRelays(lumiSetting.value.relays);
        await applyRelays();
        setSuccess();
      } catch (e) {
        setError();
      }
      return;
    }

    // useRelaySet === "0": kind:10002から取得

    try {
      await fetchKind10002();
      applyRelays();
    } catch (e) {
      setError();
      return;
    }
  }

  // --- $effect ---
  $effect(() => {
    if (paramRelays && paramRelays.length > 0) {
      if (!mainRelaysInitialized) {
        untrack(() => {
          initWithParamRelays(paramRelays);
        });
      }
      return;
    }

    untrack(() => {
      initWithDefaultRelays();
    });
  });
</script>

{#if $defo && Object.keys($defo).length > 0}
  {@render contents?.()}
{:else if status === "error"}
  {@render error?.(new Error("Failed to load relays"))}
{:else}
  {@render loading?.(loadingMessage)}
{/if}
