<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/state";

  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";
  import { usePromiseReq } from "$lib/func/nostr";
  import { generateResultMessage } from "$lib/func/util";
  import { toGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import { unsucscribeGlobal } from "$lib/func/useReq";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import Settei from "./Settei.svelte";
  import GlobalDescription from "./GlobalDescription.svelte";
  import GlobalTimeline from "./GlobalTimeline.svelte";
  import RegexFilter from "./RegexFilter.svelte";
  import {
    followList,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";

  // タイムライン表示の制御フラグ
  let openGlobalTimeline: boolean = $state(false);

  // グローバルリレーのURL配列
  let globalRelays: string[] = $state.raw([]);

  // リレー設定UIの表示フラグ
  let relaySettei = $state(false);

  // 正規表現フィルター
  let regexFilter: RegExp | null = $state(null);

  // 初期化中フラグ（重複実行防止）
  let isInitializing = false;

  // タイムラインクエリキー
  let timelineQuery = $derived(["global", "feed"]);

  // ユーザーがログインしているか
  let hasUser = $derived(lumiSetting.get().pubkey);

  // リレーが設定されているか
  let hasRelays = $derived(globalRelays.length > 0);

  /**
   * グローバルリレー設定を保存
   * @param relays 保存するリレーURL配列
   */
  const onClickSave = async (relays: string[]) => {
    console.log("[GlobalPage] saving relay config:", relays);
    $nowProgress = true;

    const newTags: string[][] = [
      ["d", "global"],
      ...relays.map((relay) => ["relay", relay]),
    ];

    const result = await safePublishEvent({
      content: "",
      tags: newTags,
      kind: 30002,
    });

    if ("errorCode" in result) {
      if (!result.isCanceled) {
        $toastSettings = {
          title: "Error",
          description: $_(result.errorCode),
          color: "bg-red-500",
        };
      }
      $nowProgress = false;
      return;
    }

    const { event, res } = result;
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);

    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: generateResultMessage(isSuccess, isFailed),
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };

    if (isSuccess.length > 0) {
      const relaylist = toGlobalRelaySet(event);
      if (relaylist.length > 0) {
        queryClient.setQueryData(
          ["globalRelay", lumiSetting.get().pubkey],
          relaylist
        );
        globalRelays = relaylist;
      }

      // 既存のタイムラインキャッシュをクリア
      queryClient.removeQueries({ queryKey: timelineQuery });
      queryClient.removeQueries({ queryKey: [...timelineQuery, "olderData"] });

      console.log("[GlobalPage] relay config saved successfully");
    }

    $nowProgress = false;
  };

  /**
   * ユーザーのグローバルリレー設定を取得
   */
  const fetchGlobalRelayConfig = async () => {
    if (!hasUser) {
      console.log("[GlobalPage] no user, skipping relay config fetch");
      return;
    }

    console.log("[GlobalPage] fetching relay config");
    await waitForConnections();

    // キャッシュから取得を試みる
    const cachedData: string[] | undefined = queryClient.getQueryData([
      "globalRelay",
      lumiSetting.get().pubkey,
    ]);

    if (cachedData && cachedData.length > 0) {
      console.log("[GlobalPage] using cached relay config:", cachedData);
      globalRelays = cachedData;
      return;
    }

    // ネットワークから取得
    $nowProgress = true;

    const fetchRelays = await usePromiseReq(
      {
        filters: [
          {
            authors: [lumiSetting.get().pubkey],
            kinds: [30002],
            "#d": ["global"],
            limit: 1,
          },
        ] as Nostr.Filter[],
        operator: pipe(latest()),
      },
      undefined,
      undefined
    );

    $nowProgress = false;

    if (fetchRelays.length > 0) {
      const relayList = toGlobalRelaySet(fetchRelays[0].event);
      if (relayList.length > 0) {
        console.log("[GlobalPage] fetched relay config:", relayList);
        queryClient.setQueryData(
          ["globalRelay", lumiSetting.get().pubkey],
          relayList
        );
        globalRelays = relayList;
      }
    } else {
      console.log("[GlobalPage] no relay config found");
    }
  };

  /**
   * タイムラインコンポーネントを再初期化
   * リレー設定変更時に呼ばれる
   */
  const reinitializeTimeline = () => {
    if (hasRelays) {
      console.log("[GlobalPage] reinitializing timeline");
      untrack(() => {
        openGlobalTimeline = false;
        setTimeout(() => {
          openGlobalTimeline = true;
        }, 1);
      });
    }
  };

  /**
   * リレー設定の初期化
   * URLパラメータまたは保存済み設定から読み込む
   */
  const initializeRelaySettings = async () => {
    console.log("[GlobalPage] initializing relay settings");

    // 既存の状態をクリア
    globalRelays = [];
    relaySettei = false;
    openGlobalTimeline = false;

    // URLパラメータからリレーを取得
    const params = new URLSearchParams(window.location.search);
    const relaysFromParams = params.getAll("relay");

    if (relaysFromParams.length > 0) {
      console.log(
        "[GlobalPage] using relays from URL params:",
        relaysFromParams
      );
      globalRelays = relaysFromParams;
    } else {
      // パラメータがない場合は設定UIを表示して保存済み設定を取得
      relaySettei = true;
      await fetchGlobalRelayConfig();
    }
  };

  /**
   * グローバルタイムラインのイベントフィルター
   * @param note フィルタリング対象のイベント
   * @returns true: 表示, false: 非表示
   */
  const checkGlobalFilter = (note: Nostr.Event): boolean => {
    try {
      const filter = timelineFilter.get();
      const global = filter?.global;

      if (!global) return true;

      // フォローしているユーザーを除外
      if (global.excludeFollowee) {
        const followListData = followList.get();
        if (followListData && typeof followListData.has === "function") {
          if (followListData.has(note.pubkey)) return false;
        }
      }

      // 会話（リプライ）を除外
      if (global.excludeConversation && (note.kind === 1 || note.kind === 42)) {
        if (Array.isArray(note.tags)) {
          const hasPTags = note.tags.some(
            (tag) =>
              Array.isArray(tag) &&
              tag[0] === "p" &&
              tag.length > 1 &&
              tag[1] !== note.pubkey
          );
          if (hasPTags) return false;
        }
      }

      // 正規表現フィルター
      if (regexFilter !== null && !regexFilter.test(note.content)) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn("[GlobalPage] error in checkGlobalFilter:", error);
      return true;
    }
  };

  onMount(async () => {
    if (isInitializing) return;
    console.log("[GlobalPage] component mounted");
    isInitializing = true;
    await initializeRelaySettings();
    isInitializing = false;
  });

  afterNavigate(async (navigate) => {
    if (navigate.type === "form" || isInitializing) {
      console.log("[GlobalPage] skipping initialization on form navigation");
      return;
    }
    console.log("[GlobalPage] navigation detected");
    isInitializing = true;
    await initializeRelaySettings();
    isInitializing = false;
  });

  beforeNavigate(() => {
    console.log("[GlobalPage] navigating away, cleaning up");
    isInitializing = false;
    globalRelays = [];
    openGlobalTimeline = false;

    // グローバルタイムラインの購読を解除
    unsucscribeGlobal();
  });

  // リレー設定が変更されたときにタイムラインを再初期化
  $effect(() => {
    reinitializeTimeline();
  });
</script>

{#if !hasUser && !hasRelays}
  <p class="whitespace-pre-wrap break-words p-2">
    {$_("global.explain")}
    <code class="block p-2 rounded">
      {`${page.url.origin}${page.url.pathname}?relay=[relayUrl]&relay=[relayUrl]`}
    </code>
    <br />
    <a
      href="/settings"
      class="underline text-magnum-400 hover:opacity-75"
      style="word-break: break-word;"
    >
      {$_("global.gotoSetting")}
    </a>
  </p>
{:else}
  <section class="w-full break-words overflow-hidden">
    {#if relaySettei}
      <Settei
        title={$_("settei.global")}
        relays={globalRelays}
        {onClickSave}
        Description={GlobalDescription}
      />
    {/if}
    <RegexFilter bind:filter={regexFilter} />
    {#if openGlobalTimeline && hasRelays}
      <GlobalTimeline
        {globalRelays}
        {timelineQuery}
        eventFilter={checkGlobalFilter}
      />
    {/if}
  </section>
{/if}

<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
