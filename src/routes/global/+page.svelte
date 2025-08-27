<script lang="ts">
  import { onMount, untrack, type SvelteComponent } from "svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/state";

  // Store imports
  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";

  // Utility function imports
  import { usePromiseReq } from "$lib/func/nostr";
  import { generateResultMessage } from "$lib/func/util";
  import { toGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import { unsucscribeGlobal } from "$lib/func/useReq";

  // Component imports
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import Settei from "./Settei.svelte";
  import GlobalDescription from "./GlobalDescription.svelte";
  import GlobalTimeline from "./GlobalTimeline.svelte";
  import {
    followList,
    lumiSetting,
    timelineFilter,
  } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";
  import RegexFilter from "./RegexFilter.svelte";

  // Constants
  //const TIE_KEY = "global";

  // State variables
  let compRef: SvelteComponent | undefined = $state();
  let openGlobalTimeline: boolean = $state(false);
  let globalRelays: string[] = $state.raw([]);
  let relaySettei = $state(false);

  // Derived values
  const timelineQuery = $derived(["global", "feed"]);

  /**
   * Handles saving the global relay configuration
   * @param relays Array of relay URLs to save
   */
  const onClickSave = async (relays: string[]) => {
    $nowProgress = true;

    // Prepare tags for the event
    const newTags = [["d", "global"]];
    relays.forEach((relay) => newTags.push(["relay", relay]));

    // Publish the event

    const result = await safePublishEvent({
      content: "",
      tags: newTags,
      kind: 30002,
    });
    if ("errorCode" in result) {
      if (result.isCanceled) {
        return; // キャンセル時は何もしない
      }
      $toastSettings = {
        title: "Error",
        description: $_(result.errorCode),
        color: "bg-red-500",
      };
      return;
    }
    // 成功時の処理
    const { event: event, res } = result;
    // Process results
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
    const resultMessage = generateResultMessage(isSuccess, isFailed);

    // Show toast notification
    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: resultMessage,
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };

    if (isSuccess.length > 0) {
      // Update relay list and clear queries
      const relaylist = toGlobalRelaySet(event);
      if (relaylist.length > 0) {
        queryClient.setQueryData(
          ["globalRelay", lumiSetting.get().pubkey],
          relaylist
        );
        globalRelays = relaylist;
      }

      // Clean up existing queries
      queryClient.removeQueries({
        queryKey: timelineQuery,
      });
      queryClient.removeQueries({
        queryKey: [...timelineQuery, "olderData"],
      });

      // Clear tie map data
      // const globalTie = $tieMapStore[TIE_KEY];
      // if (globalTie) {
      //   const [, seenOn] = globalTie;
      //   seenOn.clear();
      // }

      globalRelays = relays;
    }

    $nowProgress = false;
  };

  /**
   * Fetches the global relay configuration from the user's data
   */
  const fetchGlobalRelayConfig = async () => {
    if (!lumiSetting.get().pubkey) return;
    await waitForConnections();
    // Check if we already have the data in cache
    const cachedData: string[] | undefined = queryClient.getQueryData([
      "globalRelay",
      lumiSetting.get().pubkey,
    ]);

    if (cachedData && cachedData.length > 0) {
      globalRelays = cachedData;
      return;
    }

    // If not in cache, fetch from the network
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
        queryClient.setQueryData(
          ["globalRelay", lumiSetting.get().pubkey],
          relayList
        );
        globalRelays = relayList;
      }
    }
  };

  /**
   * Reinitializes the timeline with the provided relay configuration
   */
  const reinitializeTimeline = () => {
    if (globalRelays.length > 0) {
      untrack(() => {
        openGlobalTimeline = false;
        setTimeout(() => {
          openGlobalTimeline = true;
        }, 1);
      });
    }
  };

  /**
   * Initializes the global relay settings from URL parameters or stored settings
   */
  const initializeRelaySettings = async () => {
    globalRelays = [];

    // Check URL parameters first
    const params = new URLSearchParams(window.location.search);
    const relaysFromParams = params.getAll("relay");

    if (relaysFromParams.length > 0) {
      globalRelays = relaysFromParams;
    } else {
      relaySettei = true;
      await fetchGlobalRelayConfig();
    }
  };

  let init = false;
  // Lifecycle hooks
  onMount(async () => {
    if (init) return;
    init = true;
    await initializeRelaySettings();
    init = false;
  });

  afterNavigate(async (navigate) => {
    if (navigate.type === "form" || init) return;
    init = true;
    await initializeRelaySettings();
    init = false;
  });

  beforeNavigate(() => {
    init = false;
    // Unsubscribe from global events when navigating away
    unsucscribeGlobal();
  });

  // Effect to reinitialize the timeline when relays change
  $effect(() => {
    reinitializeTimeline();
  });

  let regexFilter: RegExp | null = $state(null);

  const checkGlobalFilter = (note: Nostr.Event): boolean => {
    try {
      let check = true;

      const filter = timelineFilter.get();
      const global = filter?.global;

      if (!global) {
        return check;
      }

      if (global.excludeFollowee) {
        try {
          const followListData = followList.get();
          if (followListData && typeof followListData.has === "function") {
            check = !followListData.has(note.pubkey);
          }
        } catch (e) {
          console.warn("Error checking followee filter:", e);
          // フォローリストチェックでエラーが出ても処理を続行
        }
      }

      if (global.excludeConversation && (note.kind === 1 || note.kind === 42)) {
        try {
          if (Array.isArray(note.tags)) {
            const pTags: string[] = note.tags
              .filter(
                (tag) =>
                  Array.isArray(tag) &&
                  tag[0] === "p" &&
                  tag.length > 1 &&
                  tag[1] !== note.pubkey
              )
              .map((tag) => tag[1]);
            if (pTags.length > 0) {
              check = false;
            }
          }
        } catch (e) {
          console.warn("Error checking conversation filter:", e);
          // 会話フィルターでエラーが出ても処理を続行
        }
      }

      // ここで regexFilter が null でなければ note.content にマッチするか確認
      //console.log(regexFilter);
      if (regexFilter !== null && !regexFilter.test(note.content)) {
        return false;
      }

      return check;
    } catch (error) {
      console.warn("Error in checkGlobalFilter:", error);
      // エラー時はフィルタリングしない（投稿を表示）
      return true;
    }
  };
</script>

{#if !lumiSetting.get().pubkey && globalRelays.length <= 0}
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
    {#if relaySettei}<!--パラムにリレーが設定されてるときはそれ表示させるだけ-->

      <Settei
        title={$_("settei.global")}
        relays={globalRelays}
        {onClickSave}
        Description={GlobalDescription}
      />
    {/if}
    <RegexFilter bind:filter={regexFilter} />
    <!-- {#snippet children()} -->
    {#if openGlobalTimeline && globalRelays.length > 0}
      <GlobalTimeline
        bind:this={compRef}
        globalRelays={$state.snapshot(globalRelays)}
        {timelineQuery}
        eventFilter={(note) => {
          return checkGlobalFilter(note);
        }}
      />
    {/if}
    <!-- {/snippet} -->
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
