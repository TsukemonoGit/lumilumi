<script lang="ts">
  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import { awaitInterval, generateResultMessage } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import SearchResult from "./SearchResult.svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import SearchDescription from "./SearchDescription.svelte";
  import * as Nostr from "nostr-typedef";
  import {
    defaultRelays,
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { onMount, type SvelteComponent } from "svelte";

  import Settei from "../global/Settei.svelte";
  import SearchOption from "./SearchOption.svelte";
  import { _ } from "svelte-i18n";

  import { nip50relays } from "$lib/func/constants";
  import { npubRegex } from "$lib/func/regex";

  import type { PageData } from "./$types";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr";
  import { toGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import { followList } from "$lib/stores/globalRunes.svelte";

  let { data }: { data: PageData } = $props();

  let searchWord: string | undefined = $state();
  let searchKind: number | undefined = $state();
  let searchPubkey = $state("");
  let searchSince: number | undefined = $state();
  let searchUntil: number | undefined = $state();
  let searchHashtag: string | undefined = $state();
  let searchPubkeyTo: string = $state("");
  let followee = $state(false);
  // const filters: Writable<Nostr.Filter[]> = writable([]);
  let filters = $derived(createFilter());
  let showFilters: Nostr.Filter[] = $state.raw([]);

  let compRef: SvelteComponent | undefined = $state();
  let openSearchResult = $state(false);

  let searchRelays = $state(nip50relays);
  // function updateQueryParams() {
  //   const params = new URLSearchParams(window.location.search);
  //   searchHashtag ? params.set("t", searchHashtag) : params.delete("t");
  //   searchWord ? params.set("word", searchWord) : params.delete("word");
  //   searchKind !== undefined && searchKind !== null
  //     ? params.set("k", String(searchKind))
  //     : params.delete("k");
  //   searchPubkey ? params.set("author", searchPubkey) : params.delete("author");
  //   searchPubkeyTo ? params.set("p", searchPubkeyTo) : params.delete("p");
  //   searchSince ? params.set("s", String(searchSince)) : params.delete("s");
  //   searchUntil ? params.set("u", String(searchUntil)) : params.delete("u");
  //   followee ? params.set("f", String(followee)) : params.delete("f");

  //   const newUrl = `${window.location.pathname}?${params.toString()}`;
  //   pushState(newUrl, {});
  // }

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
    setSearchRelay();

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

      // filters = createFilter();
      // showFilters = filters.map((filter) => {
      //   return { ...filter, limit: 50 };
      // });
      console.log("showFilters", showFilters);
      console.log("searchRelays", searchRelays);
      handleClickSearch();
    }
    isMount = false;
  }

  const setSearchRelay = async () => {
    //すでにあるならデータをセットする
    const data: string[] | undefined = queryClient.getQueryData([
      "searchRelay",
      $loginUser,
    ]);

    if (data) {
      searchRelays = data;
    } else {
      $nowProgress = true;
      const fetchRelays = await usePromiseReq(
        {
          filters: [
            { authors: [$loginUser], kinds: [10007], limit: 1 },
          ] as Nostr.Filter[],
          operator: pipe(latest()),
        },
        undefined,
        undefined
      );
      $nowProgress = false;
      if (fetchRelays.length > 0) {
        const relaylist = toGlobalRelaySet(fetchRelays[0].event);
        if (relaylist.length > 0) {
          queryClient.setQueryData(["searchRelay", $loginUser], relaylist);
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

  function getHex(str: string): string {
    try {
      return nip19.decode(str).data as string;
    } catch (error) {
      console.log("pubkey error");
      return "";
    }
  }

  function createFilter(): Nostr.Filter[] {
    let filter: Nostr.Filter;

    filter = {
      search: searchWord || undefined,

      authors: npubRegex.test(searchPubkey?.trim() ?? "")
        ? [getHex(searchPubkey?.trim() ?? "")]
        : followee && followList.get()
          ? Array.from(followList.get().keys())
          : undefined,
      since: !Number.isNaN(searchSince) ? searchSince : undefined,
      until: !Number.isNaN(searchUntil) ? searchUntil : undefined,
      // "#t": searchHashtag ? [searchHashtag] : [],
      // "#p": npubRegex.test(searchPubkeyTo) ? [getHex(searchPubkeyTo)] : [],
    };

    if (searchHashtag) {
      filter = { ...filter, "#t": [searchHashtag] };
    }
    if (npubRegex.test(searchPubkeyTo?.trim() ?? "")) {
      filter = { ...filter, "#p": [getHex(searchPubkeyTo?.trim() ?? "")] };
    }

    filter.kinds =
      searchKind === undefined || searchKind === null
        ? undefined
        : [searchKind];

    return [filter];
  }

  function handleClickSearch() {
    $nowProgress = true;
    // updateQueryParams();
    showFilters = filters.map((filter) => {
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
      const relaylist = toGlobalRelaySet(event);
      if (relaylist.length > 0) {
        queryClient.setQueryData(["searchRelay", $loginUser], relaylist);
        searchRelays = relaylist;
      }
    }
    // if (isSuccess.length > 0) {
    //   queryClient.refetchQueries({
    //     queryKey: key,
    //   });
    // }
    $nowProgress = false;
  };
</script>

<section>
  {#if $loginUser}
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
