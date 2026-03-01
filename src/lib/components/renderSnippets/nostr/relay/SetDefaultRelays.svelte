<!--SetDefaultRelays.svelte-->
<script lang="ts">
  import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
  import type { ReqStatus } from "$lib/types";

  import type Nostr from "nostr-typedef";
  import {
    type DefaultRelayConfig,
    type EventPacket,
    type RxReq,
    type RxReqEmittable,
    type RxReqOverable,
    type RxReqPipeable,
    latest,
    uniq,
  } from "rx-nostr";
  import { pipe } from "rxjs";
  import { setRelays, usePromiseReq } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/relays";
  import { defaultRelays as defo, queryClient } from "$lib/stores/stores";
  import { app } from "$lib/stores/stores";
  import {
    lumiSetting,
    relayConnectionState,
  } from "$lib/stores/globalRunes.svelte";
  import { untrack, type Snippet } from "svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";
  import type { AcceptableDefaultRelaysConfig } from "rx-nostr";
  import { get } from "svelte/store";
  import { normalizeURL } from "nostr-tools/utils";

  interface Props {
    paramRelays: string[] | undefined;
    req?:
      | (RxReq<"backward"> &
          RxReqEmittable<{
            relays: string[];
          }> &
          RxReqOverable &
          RxReqPipeable)
      | undefined;
    error?: Snippet<[Error]>;
    loading?: Snippet<[string]>;
    contents?: Snippet;
  }

  let {
    req = undefined,
    paramRelays = undefined,
    error,
    loading,
    contents,
  }: Props = $props();

  const pubkey = lumiSetting.get().pubkey;
  const queryKey = ["defaultRelay", pubkey];
  const filters: Nostr.Filter[] = [
    { authors: [pubkey], kinds: [10002], limit: 1 },
  ];

  let timelineRelays = $derived.by(() => {
    if (!$defo) return {};
    return Object.fromEntries(
      Object.entries($defo).filter(([_, config]) => config.read === true),
    );
  });

  let status: ReqStatus | undefined = $state();
  let loadingMessage: string = $state("connectingRelay.establishing");
  let mainRelaysInitialized = $state(false);

  // --- ヘルパー関数 ---

  /** writeリレー設定を抽出（read=false, write=true のみ） */
  function extractWriteRelays(
    relayConfigs: DefaultRelayConfig[],
  ): DefaultRelayConfig[] {
    return relayConfigs
      .filter((r) => r.write === true)
      .map((r) => ({
        url: normalizeURL(r.url),
        read: false,
        write: true,
      }));
  }

  /** readEntries と writeRelays をマージ（同一URLはwrite=trueを付与） */
  function mergeRelays(
    readEntries: DefaultRelayConfig[],
    writeRelays: DefaultRelayConfig[],
  ): DefaultRelayConfig[] {
    const merged = new Map<string, DefaultRelayConfig>();
    for (const entry of readEntries) {
      merged.set(entry.url, { ...entry });
    }
    for (const entry of writeRelays) {
      const nurl = normalizeURL(entry.url);
      if (merged.has(nurl)) {
        merged.get(nurl)!.write = true;
      } else {
        merged.set(nurl, { url: nurl, read: false, write: true });
      }
    }
    return [...merged.values()];
  }

  /** リレーを適用し、接続を待機 */
  async function applyRelays(
    relays: AcceptableDefaultRelaysConfig,
  ): Promise<void> {
    setRelays(relays);
    relayConnectionState.setReady(false);

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

    const finalReadRelays = Object.entries(get(defo) ?? {}).filter(
      ([_, config]) => config.read === true,
    );

    if (finalReadRelays.length === 0) {
      throw new Error("No read relays available after connection attempt");
    }

    relayConnectionState.setReady(true);
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

  /** lumiSettingのuseRelaySetに応じてwriteリレー設定を取得 */
  function getWriteRelaysFromSettings(): DefaultRelayConfig[] {
    return extractWriteRelays(lumiSetting.get().relays as DefaultRelayConfig[]);
  }

  /** kind:10002のEventPacketからwriteリレー設定を取得 */
  function getWriteRelaysFrom10002(
    eventPacket: EventPacket,
  ): DefaultRelayConfig[] {
    const relays = setRelaysByKind10002(eventPacket.event);
    return extractWriteRelays(relays);
  }

  /** kind:10002をフェッチ（キャッシュ確認 → リクエスト） */
  async function fetchKind10002(
    onMidStreamData?: (packet: EventPacket) => void,
  ): Promise<EventPacket | undefined> {
    // キャッシュチェック
    const cachedData: EventPacket | undefined | null =
      queryClient.getQueryData(queryKey);
    if (cachedData) return cachedData;

    // フェッチ
    $app.rxNostr.setDefaultRelays(defaultRelays);
    const result = await usePromiseReq(
      { filters, operator: pipe(uniq(), latest()), req },
      defaultRelays,
      3000,
      (packets: EventPacket[]) => {
        if (packets.length > 0) {
          queryClient.setQueryData(queryKey, packets[0]);
          onMidStreamData?.(packets[0]);
        }
      },
    );
    if (result.length > 0) {
      queryClient.setQueryData(queryKey, result[0]);
      return result[0];
    }
    return undefined;
  }

  // --- paramRelaysあり: paramRelaysをread用、10002のwriteをマージ ---
  async function initWithParamRelays(
    readEntries: DefaultRelayConfig[],
  ): Promise<void> {
    status = "loading";

    if (!pubkey) {
      await applyRelays(readEntries);
      setSuccess();
      return;
    }

    let writeRelays: DefaultRelayConfig[] = [];

    if (lumiSetting.get().useRelaySet === "0") {
      try {
        const eventPacket = await fetchKind10002((midPacket) => {
          // 途中受信データでも即座にリレーを適用してsuccessに移行
          const midWriteRelays = getWriteRelaysFrom10002(midPacket);
          const midMerged = mergeRelays(readEntries, midWriteRelays);
          applyRelays(midMerged)
            .then(() => setSuccess())
            .catch((e) => console.warn("Mid-stream relay apply failed:", e));
        });
        if (eventPacket) {
          writeRelays = getWriteRelaysFrom10002(eventPacket);
        }
      } catch (e) {
        console.warn(
          "kind:10002 fetch failed, proceeding without write relays",
          e,
        );
      }
    } else {
      writeRelays = getWriteRelaysFromSettings();
    }

    const merged = mergeRelays(readEntries, writeRelays);
    console.log("merged before applyRelays:", merged);

    try {
      await applyRelays(merged);
      setSuccess();
    } catch (e) {
      setError();
    }
  }

  // --- paramRelaysなし: kind:10002またはsettingsからリレーをセット ---
  async function initWithDefaultRelays(): Promise<void> {
    if (!pubkey) {
      try {
        await applyRelays(defaultRelays);
        setSuccess();
      } catch (e) {
        setError();
      }
      return;
    }

    status = "loading";

    if (lumiSetting.get().useRelaySet !== "0") {
      try {
        await applyRelays(lumiSetting.get().relays);
        setSuccess();
      } catch (e) {
        setError();
      }
      return;
    }

    // useRelaySet === "0": kind:10002から取得
    let eventPacket: EventPacket | undefined;
    try {
      eventPacket = await fetchKind10002((midPacket) => {
        // 途中受信データでも即座にリレーを適用してsuccessに移行
        const midRelays = setRelaysByKind10002(midPacket.event);
        applyRelays(midRelays)
          .then(() => setSuccess())
          .catch((e) => console.warn("Mid-stream relay apply failed:", e));
      });
    } catch (e) {
      setError();
      return;
    }

    if (eventPacket) {
      const relays = setRelaysByKind10002(eventPacket.event);
      try {
        await applyRelays(relays);
        setSuccess();
      } catch (e) {
        setError();
      }
    } else {
      // kind:10002 が見つからなかった場合、defaultRelays にフォールバック
      console.warn("kind:10002 not found, falling back to default relays");
      loadingMessage = "connectingRelay.usingDefault";
      try {
        await applyRelays(defaultRelays);
        setSuccess();
      } catch (e) {
        setError();
      }
    }
  }

  // --- $effect ---
  $effect(() => {
    if (paramRelays && paramRelays.length > 0) {
      if (!mainRelaysInitialized) {
        untrack(() => {
          const readEntries = paramRelays!.map((r) => ({
            url: normalizeURL(r),
            read: true,
            write: true,
          }));
          initWithParamRelays(readEntries);
        });
      }
      return;
    }

    untrack(() => {
      initWithDefaultRelays();
    });
  });
</script>

{#if mainRelaysInitialized && Object.keys(timelineRelays).length > 0}
  {@render contents?.()}
{:else if status === "error"}
  {@render error?.(new Error("Failed to load relays"))}
{:else}
  {@render loading?.(loadingMessage)}
{/if}
