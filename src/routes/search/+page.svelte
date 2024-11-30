<script lang="ts">
  import { run } from "svelte/legacy";

  import { promisePublishEvent } from "$lib/func/nostr";
  import { awaitInterval, generateResultMessage } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import SearchResult from "./SearchResult.svelte";
  import { afterNavigate, beforeNavigate, pushState } from "$app/navigation";
  import SearchDescription from "./SearchDescription.svelte";
  import { writable, type Writable } from "svelte/store";
  import * as Nostr from "nostr-typedef";
  import {
    defaultRelays,
    followList,
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { onMount, untrack, type SvelteComponent } from "svelte";
  import SetSearchRelays from "$lib/components/NostrMainData/SetSearchRelays.svelte";
  import Settei from "../global/Settei.svelte";
  import SearchOption from "./SearchOption.svelte";
  import { _ } from "svelte-i18n";
  import type { EventPacket } from "rx-nostr";
  import { nip50relays } from "$lib/func/constants";
  import { npubRegex } from "$lib/func/regex";

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let searchWord: string | undefined = $state();
  let searchKind: number | undefined = $state();
  let searchPubkey = $state("");
  let searchSince: number | undefined = $state();
  let searchUntil: number | undefined = $state();
  let searchHashtag: string | undefined = $state();
  let searchPubkeyTo: string = $state("");
  let followee = $state(false);
  const filters: Writable<Nostr.Filter[]> = writable([]);
  let showFilters: Nostr.Filter[] = $state([]);

  let compRef: SvelteComponent | undefined = $state();
  let openSearchResult = $state(false);

  let searchRelays = $state(nip50relays);
  function updateQueryParams() {
    const params = new URLSearchParams(window.location.search);
    searchHashtag ? params.set("t", searchHashtag) : params.delete("t");
    searchWord ? params.set("word", searchWord) : params.delete("word");
    searchKind !== undefined && searchKind !== null
      ? params.set("k", String(searchKind))
      : params.delete("k");
    searchPubkey ? params.set("author", searchPubkey) : params.delete("author");
    searchPubkeyTo ? params.set("p", searchPubkey) : params.delete("p");
    searchSince ? params.set("s", String(searchSince)) : params.delete("s");
    searchUntil ? params.set("u", String(searchUntil)) : params.delete("u");
    followee ? params.set("f", String(followee)) : params.delete("f");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    pushState(newUrl, {});
  }
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
  let readUrls: string[] = $state([]);

  async function waitForDefaultRelays(maxWaitTime: number) {
    const interval = 100; // 100ms ごとにチェック
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
    const queryData: EventPacket | undefined = $queryClient.getQueryData([
      "searchRelay",
      $loginUser,
    ]);
    console.log("afterNavigate", queryData);
    if (queryData) {
      searchRelays = (queryData.event.tags as string[][])
        .filter((tag: string[]) => tag[0] === "relay" && tag.length > 1)
        .map((tag: string[]) => tag[1]);
    }

    // // const params = get(page).url.searchParams;
    // const params = new URLSearchParams(window.location.search);
    // console.log(params);

    searchHashtag = data.searchHashtag;
    searchWord = data.searchWord;
    searchKind = data.searchKind;
    searchPubkey = data.searchPubkey;
    searchPubkeyTo = data.searchPubkeyTo;
    searchSince = data.searchSince;
    searchUntil = data.searchUntil;
    followee = data.followee;
    //kindはデフォ値があるから含めない
    if (
      searchHashtag ||
      searchWord ||
      searchPubkey ||
      searchPubkeyTo ||
      searchSince ||
      searchUntil ||
      searchKind ||
      searchKind === 0
    ) {
      await waitForDefaultRelays(5000);

      createFilter();
      // showFilters = $filters.map((filter) => {
      //   return { ...filter, limit: 50 };
      // });
      console.log("showFilters", showFilters);
      console.log("searchRelays", searchRelays);
      handleClickSearch();
    }
    isMount = false;
  }

  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      openSearchResult = false;
    }
  });

  function getHex(str: string): string {
    try {
      return nip19.decode(str).data as string;
    } catch (error) {
      console.log("pubkey error");
      return "";
    }
  }

  function createFilter() {
    searchPubkey = searchPubkey?.trim() ?? "";
    searchPubkeyTo = searchPubkeyTo?.trim() ?? "";
    $filters = [
      {
        search: searchWord || undefined,

        authors: npubRegex.test(searchPubkey)
          ? [getHex(searchPubkey)]
          : followee && $followList
            ? Array.from($followList.keys())
            : undefined,
        since: !Number.isNaN(searchSince) ? searchSince : undefined,
        until: !Number.isNaN(searchUntil) ? searchUntil : undefined,
        // "#t": searchHashtag ? [searchHashtag] : [],
        // "#p": npubRegex.test(searchPubkeyTo) ? [getHex(searchPubkeyTo)] : [],
      },
    ];
    if (searchHashtag) {
      $filters[0] = { ...$filters[0], "#t": [searchHashtag] };
    }
    if (npubRegex.test(searchPubkeyTo)) {
      $filters[0] = { ...$filters[0], "#p": [getHex(searchPubkeyTo)] };
    }

    $filters[0].kinds =
      searchKind === undefined || searchKind === null
        ? undefined
        : [searchKind];

    // const chunk = 100;
    // if (
    //   followee &&
    //   followingList !== undefined &&
    //   followingList.length > chunk
    // ) {
    //   const splitList = splitArray(followingList, chunk);
    //   // filters配列に、authorsの値をそれぞれのチャンクごとに分割して追加
    //   $filters = splitList.map((list) => ({
    //     ...$filters[0], // $filters[0] のその他のデータを維持
    //     authors: list, // authors を分割されたリストに置き換える
    //   }));
    // }
  }

  function handleClickSearch() {
    $nowProgress = true;
    updateQueryParams();
    showFilters = $filters.map((filter) => {
      return { ...filter, limit: 50 };
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
    searchSince = undefined;
    searchUntil = undefined;
  }

  // const handleReload = () => {
  //   console.log("reload");
  // };

  const onClickSave = async (relays: string[]) => {
    console.log("save");
    $nowProgress = true;
    console.log(relays);
    const newTags: string[][] = [];
    relays.map((relay) => newTags.push(["relay", relay]));
    console.log(newTags);
    const { event, res } = await promisePublishEvent({
      content: "",
      tags: newTags,
      kind: 10007,
    });
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
      $queryClient.refetchQueries({
        queryKey: ["searchRelay", $loginUser],
      });
    }
    // if (isSuccess.length > 0) {
    //   $queryClient.refetchQueries({
    //     queryKey: key,
    //   });
    // }
    $nowProgress = false;
  };

  const setRelay = (relays: string[]) => {
    console.log(relays);
    searchRelays = relays;
  };
  defaultRelays.subscribe((value) => {
    if (value) {
      readUrls = Object.values(value)
        .filter((config) => config.read)
        .map((config) => config.url);
    }
  });
  $effect(() => {
    if (
      searchKind === searchKind ||
      searchHashtag ||
      searchWord ||
      searchPubkey ||
      searchPubkeyTo ||
      searchSince ||
      searchUntil ||
      followee
    ) {
      untrack(() => createFilter());
    }
  });
</script>

<section>
  {#if $loginUser}
    <SetSearchRelays pubkey={$loginUser} relayChange={setRelay}>
      {#snippet loading()}
        <div class="w-full"></div>
      {/snippet}
      {#snippet error()}
        <div class="w-full"></div>
      {/snippet}
      {#snippet nodata()}
        <div class="w-full"></div>
      {/snippet}
    </SetSearchRelays>

    <Settei
      title={"Search"}
      relays={searchRelays}
      {onClickSave}
      Description={SearchDescription}
    />{/if}<SearchOption
    bind:searchKind
    bind:searchHashtag
    bind:searchWord
    bind:searchPubkey
    bind:searchPubkeyTo
    bind:searchSince
    bind:searchUntil
    bind:followee
    {handleClickSearch}
    {createFilter}
    {resetValue}
    {filters}
  />

  {#if openSearchResult}
    <SearchResult
      bind:this={compRef}
      filters={showFilters}
      relays={searchRelays}
    />
  {/if}
</section>
