<script lang="ts">
  import { usePromiseReq } from "$lib/func/nostr";
  import { awaitInterval, generateResultMessage } from "$lib/func/util";

  import SearchResult from "./SearchResult.svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import SearchDescription from "./SearchDescription.svelte";
  import * as Nostr from "nostr-typedef";
  import {
    defaultRelays,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { onMount, type SvelteComponent } from "svelte";

  import Settei from "../global/Settei.svelte";
  import SearchOption from "./SearchOption.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { nip50relays } from "$lib/func/constants";
  import { parseSearchInput, toNostrFilter } from "$lib/func/SearchQueryParser";

  import type { PageData } from "./$types";
  import { pipe } from "rxjs";
  import { latest, type EventPacket } from "rx-nostr";
  import { toGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { page } from "$app/state";
  import { safePublishEvent } from "$lib/func/publishError";

  let { data }: { data: PageData } = $props();

  let searchWord: string | undefined = $state();

  let followee = $state(false);

  let filters: Nostr.Filter[] = $state([]);
  let showFilters: Nostr.Filter[] = $state.raw([]);

  let compRef: SvelteComponent | undefined = $state();
  let openSearchResult = $state(false);

  let searchRelays = $state(nip50relays);

  let excludeProxy = $state(false);

  let isMount = false;
  afterNavigate((navigate) => {
    openSearchResult = false;
    if (navigate.type !== "form" && !isMount) {
      isMount = true;
      init();
    }
  });
  onMount(() => {
    if (!isMount) {
      isMount = true;
      init();
    }
  });

  async function waitForDefaultRelays(maxWaitTime: number) {
    const interval = 100;
    let waitedTime = 0;

    while (!$defaultRelays || Object.keys($defaultRelays).length === 0) {
      if (waitedTime >= maxWaitTime) {
        return;
      }
      await awaitInterval(interval);
      waitedTime += interval;
    }
    return;
  }

  async function init() {
    setSearchRelay();

    const params = page.url.searchParams;

    // followee パラメータ復元
    const f = params.get("followee");
    if (f === "1" || f === "true") {
      followee = true;
    }

    // excludeProxy パラメータ復元
    const e = params.get("excludeProxy");
    if (e === "1" || e === "true") {
      excludeProxy = true;
    }

    // load パラメータ確認（例: ?load=false）
    const loadParam = params.get("load");
    const shouldLoad = !(
      loadParam &&
      (loadParam === "0" || loadParam === "false")
    );

    // q パラメータ復元
    const q = params.get("q");
    if (q) {
      searchWord = q;
      createFilter(q);
      await waitForDefaultRelays(5000);
      if (shouldLoad) {
        handleClickSearch();
      }
    }
    isMount = false;
  }

  const setSearchRelay = async () => {
    const data: string[] | undefined = queryClient.getQueryData([
      "searchRelay",
      lumiSetting.get().pubkey,
    ]);

    if (data) {
      searchRelays = data;
    } else {
      $nowProgress = true;
      const fetchRelays = await usePromiseReq(
        {
          filters: [
            { authors: [lumiSetting.get().pubkey], kinds: [10007], limit: 1 },
          ] as Nostr.Filter[],
          operator: pipe(latest()),
        },
        undefined,
        undefined
      );

      $nowProgress = false;
      if (fetchRelays.length > 0) {
        queryClient.setQueryData(
          ["naddr", `10007:${lumiSetting.get().pubkey}:`],
          fetchRelays[0]
        );
        const relaylist = toGlobalRelaySet(fetchRelays[0].event);
        if (relaylist.length > 0) {
          queryClient.setQueryData(
            ["searchRelay", lumiSetting.get().pubkey],
            relaylist
          );
          searchRelays = relaylist;
        }
      }
    }
  };

  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      openSearchResult = false;
    }
  });

  function createFilter(ward: string): void {
    const parsed = parseSearchInput(ward);
    const filter = toNostrFilter(parsed);

    // followee フィルターを適用
    if (followee && followList.get() && followList.get().size > 0) {
      if (filter.authors) {
        // 既存のauthorsとfolloweeを組み合わせ（重複除去）
        const existingAuthors = new Set(filter.authors);
        const followeeAuthors = Array.from(followList.get().keys());
        filter.authors = Array.from(
          new Set([...existingAuthors, ...followeeAuthors])
        );
      } else {
        filter.authors = Array.from(followList.get().keys());
      }
    }
    filters = [filter];
  }

  function handleClickSearch() {
    $nowProgress = true;

    showFilters = filters.map((filter) => {
      const cleanFilter = { ...filter, limit: 50 };

      return Object.fromEntries(
        Object.entries(cleanFilter).filter(
          ([key, value]) => value !== undefined
        )
      ) as Nostr.Filter;
    });

    if (openSearchResult) {
      openSearchResult = false;
      setTimeout(() => {
        openSearchResult = true;
      }, 0);
    } else {
      setTimeout(() => {
        openSearchResult = true;
      }, 0);
    }
    $nowProgress = false;
  }

  function resetValue() {
    searchWord = "";
  }

  const onClickSave = async (relays: string[]) => {
    console.log("save");
    $nowProgress = true;
    console.log(relays);
    const newTags: string[][] = [];
    relays.map((relay) => newTags.push(["relay", relay]));
    console.log(newTags);
    const ev: EventPacket | undefined = queryClient.getQueryData([
      "naddr",
      `10007:${lumiSetting.get().pubkey}:`,
    ]);

    const result = await safePublishEvent({
      content: ev?.event.content || "",
      tags: newTags,
      kind: 10007,
    });
    if ("errorCode" in result) {
      if (result.isCanceled) {
        return;
      }
      $toastSettings = {
        title: "Error",
        description: $_(result.errorCode),
        color: "bg-red-500",
      };
      return;
    }

    const { event: event, res } = result;
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);

    let str = generateResultMessage(isSuccess, isFailed);
    console.log(str);

    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: str,
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };

    if (isSuccess.length > 0) {
      const relaylist = toGlobalRelaySet(event);
      if (relaylist.length > 0) {
        queryClient.setQueryData(
          ["searchRelay", lumiSetting.get().pubkey],
          relaylist
        );
        searchRelays = relaylist;
      }
    }
    $nowProgress = false;
  };

  const eventFilter = (ev: Nostr.Event): boolean => {
    if (!excludeProxy) {
      return true;
    }

    const proxyTagValue = ev.tags.find((tag) => tag[0] === "proxy")?.[2];
    if (!proxyTagValue) return true;
    return ["rss", "web"].includes(proxyTagValue);
  };
</script>

<section>
  {#if lumiSetting.get().pubkey}
    <Settei
      title={$_("settei.search")}
      relays={searchRelays}
      {onClickSave}
      Description={SearchDescription}
    />
  {/if}

  <SearchOption
    bind:excludeProxy
    bind:searchWord
    bind:followee
    {handleClickSearch}
    {createFilter}
    {resetValue}
    {filters}
  />

  <!-- <div class="w-full mt-4 opacity-80">
    <div
      class="border border-magnum-500/80 rounded-md max-h-40 break-all overflow-y-auto p-1"
    >
      <div class="font-semibold text-magnum-400">Filters</div>
      {#each filters as filter}
        <pre
          class="text-xs text-magnum-300 whitespace-pre-wrap">{JSON.stringify(
            filter,
            null,
            2
          )}</pre>
      {/each}
    </div>
  </div> -->

  {#if openSearchResult}
    <SearchResult
      {eventFilter}
      bind:this={compRef}
      filters={showFilters}
      relays={searchRelays}
    />
  {/if}
</section>
