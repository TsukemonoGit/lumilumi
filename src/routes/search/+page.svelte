<script lang="ts">
  import DateRangePicker from "$lib/components/Elements/DateRangePicker.svelte";
  import { createCollapsible, melt } from "@melt-ui/svelte";
  import { X, ChevronsUpDown } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import { getFollowingList } from "$lib/func/nostr";
  import { nip50relays, npubRegex } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import SearchResult from "./SearchResult.svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/stores";
  import { get } from "svelte/store";
  import * as Nostr from "nostr-typedef";
  import { nowProgress } from "$lib/stores/stores";
  import { onMount, type SvelteComponent } from "svelte";

  let searchWord = "";
  let searchKind = 1;
  let searchPubkey = "";
  let searchSince: number | undefined;
  let searchUntil: number | undefined;
  let searchHashtag: string | undefined;
  let followee = false;
  let filter: Nostr.Filter;
  let showFilter: Nostr.Filter;

  let compRef: SvelteComponent;
  let openSearchResult = false;

  function updateQueryParams() {
    const params = new URLSearchParams(window.location.search);
    searchHashtag ? params.set("t", searchHashtag) : params.delete("t");
    searchWord ? params.set("q", searchWord) : params.delete("q");
    searchKind !== undefined
      ? params.set("k", String(searchKind))
      : params.delete("k");
    searchPubkey ? params.set("p", searchPubkey) : params.delete("p");
    searchSince ? params.set("s", String(searchSince)) : params.delete("s");
    searchUntil ? params.set("u", String(searchUntil)) : params.delete("u");
    followee ? params.set("f", String(followee)) : params.delete("f");

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.pushState({}, "", newUrl);
  }
  let isMount = false;
  afterNavigate(() => {
    openSearchResult = false;
    if (!isMount) {
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

  async function init() {
    const params = get(page).url.searchParams;
    searchHashtag = params.get("t") ?? undefined;
    searchWord = params.get("q") ?? "";
    searchKind = params.get("k") !== null ? Number(params.get("k")) : 1;
    searchPubkey = params.get("p") ?? "";
    searchSince = params.get("s") ? Number(params.get("s")) : undefined;
    searchUntil = params.get("u") ? Number(params.get("u")) : undefined;
    followee = params.get("f") === "true";
    //kindはデフォ値があるから含めない
    if (
      searchHashtag ||
      searchWord ||
      searchPubkey ||
      searchSince ||
      searchUntil
    ) {
      createFilter();
      showFilter = { ...filter, limit: 50 };
      handleClickSearch();
    }
    isMount = false;
  }

  beforeNavigate(() => {
    openSearchResult = false;
  });

  $: followingList = getFollowingList();
  $: if (
    searchKind === searchKind ||
    searchHashtag ||
    searchWord ||
    searchPubkey ||
    searchSince ||
    searchUntil
  ) {
    createFilter();
  }

  const {
    elements: { root, content, trigger },
    states: { open },
  } = createCollapsible({ forceVisible: true });

  function getHex(str: string): string {
    try {
      return nip19.decode(str).data as string;
    } catch (error) {
      console.log("pubkey error");
      return "";
    }
  }

  function createFilter() {
    filter = {
      search: searchWord || undefined,
      kinds: [searchKind],
      authors: npubRegex.test(searchPubkey)
        ? [getHex(searchPubkey)]
        : followee
          ? followingList
          : undefined,
      since: !Number.isNaN(searchSince) ? searchSince : undefined,
      until: !Number.isNaN(searchUntil) ? searchUntil : undefined,
      "#t": searchHashtag ? [searchHashtag] : [],
    };
  }

  function handleClickSearch() {
    $nowProgress = true;
    updateQueryParams();
    showFilter = { ...filter, limit: 50 };

    if (openSearchResult) {
      openSearchResult = false;
      setTimeout(() => {
        openSearchResult = true;
      }, 10);
    } else {
      openSearchResult = true;
    }
    $nowProgress = false;
  }

  function resetValue() {
    searchSince = undefined;
    searchUntil = undefined;
  }

  async function handleClickPub() {
    try {
      const pub = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
      if (pub) {
        searchPubkey = nip19.npubEncode(pub);
      }
    } catch (error) {
      console.log("failed to get pubkey");
    }
  }
</script>

<svelte:head>
  <title>Lumilumi-Search</title>
  <meta property="og:description" content="Search" />
  <meta name="description" content="Search" />
</svelte:head>

<section>
  <div class="flex gap-2">
    <div class="font-medium text-magnum-400">SearchRelays</div>
    <div class="text-sm">
      {nip50relays.join(", ")}
    </div>
  </div>
  <div class="flex flex-wrap gap-2 mb-2">
    <div class="flex flex-col items-start justify-center">
      <div class="font-medium text-magnum-400">keyword</div>
      <input
        type="text"
        id="word"
        class="h-10 w-[240px] rounded-md px-3 py-2 border border-magnum-500 mt-1.5"
        placeholder=""
        bind:value={searchWord}
      />
    </div>
    {#if followingList !== undefined && followingList.length > 0}
      <div class="flex flex-col items-start justify-center mt-auto py-2">
        <label>
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={followee}
          />
          only followee
        </label>
      </div>
    {/if}
  </div>

  <div use:melt={$root} class="relative w-full">
    <button
      use:melt={$trigger}
      class="flex w-full items-center justify-between bg-magnum-900/50 p-1 rounded-md"
    >
      <span class="font-semibold text-magnum-400">Options</span>
      <button
        class="relative h-8 w-8 place-items-center rounded-md text-sm shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 bg-magnum-600"
        aria-label="Toggle"
      >
        <div class="justify-center flex">
          {#if $open}
            <X class="size-5" />
          {:else}
            <ChevronsUpDown class="size-5" />
          {/if}
        </div>
      </button>
    </button>

    <div>
      {#if $open}
        <div
          use:melt={$content}
          transition:slide
          class="flex gap-2 w-full flex-wrap"
        >
          <div class="flex flex-col items-start justify-center">
            <div class="font-medium text-magnum-400">kind</div>
            <input
              type="number"
              id="kind"
              class="h-10 w-[120px] rounded-md px-3 py-2 border border-magnum-600 bg-neutral-900 mt-1.5"
              placeholder="1"
              min="0"
              bind:value={searchKind}
            />
          </div>
          <div class="flex flex-col items-start justify-center w-full">
            <div class="font-medium text-magnum-400">pubkey</div>
            <div
              class="grid grid-cols-[1fr_auto] mt-1.5 divide-x divide-magnum-500 rounded-md border border-magnum-600 w-full"
            >
              <input
                type="text"
                id="npub"
                class="h-10 px-3 py-2 rounded-md"
                placeholder="npub"
                bind:value={searchPubkey}
              /><button
                on:click={handleClickPub}
                class="h-10 rounded-md bg-magnum-600 px-3 py-2 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
                >Set My Pubkey</button
              >
            </div>
          </div>
          <div class="flex flex-col items-start justify-center w-full">
            <div class="font-medium text-magnum-400">hashtag</div>

            <input
              type="text"
              id="hashtag"
              class="h-10 w-full px-3 py-2 rounded-md border border-magnum-600"
              placeholder="hashtag"
              bind:value={searchHashtag}
            />
          </div>
          <div class="flex flex-row items-start justify-center">
            <DateRangePicker
              bind:startTimeUnix={searchSince}
              bind:endTimeUnix={searchUntil}
              title={"Date"}
            />
            <button
              on:click={resetValue}
              class="h-8 w-8 place-items-center rounded-md text-sm shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 bg-magnum-600 justify-center inline-flex mt-auto mb-1 ml-1"
            >
              <X class="size-5" /></button
            >
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="w-full">
    <div
      class="border border-magnum-700 rounded-md max-h-40 break-all overflow-y-auto m-1 p-1"
    >
      <div class="font-semibold text-magnum-400">Filter</div>
      {JSON.stringify(filter, null, 2)}
    </div>
  </div>
  <button
    class="rounded-md bg-magnum-200 px-3 w-40 py-3 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25"
    disabled={$nowProgress}
    on:click={handleClickSearch}>Search</button
  >
</section>
{#if openSearchResult}
  <SearchResult bind:this={compRef} filter={showFilter} />
{/if}
