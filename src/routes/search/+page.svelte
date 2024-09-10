<script lang="ts">
  import DateRangePicker from "$lib/components/Elements/DateRangePicker.svelte";
  import { createCollapsible, melt } from "@melt-ui/svelte";
  import { X, ChevronsUpDown } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import { getFollowingList } from "$lib/func/nostr";
  import { eventKinds, nip50relays, npubRegex } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import SearchResult from "./SearchResult.svelte";
  import { afterNavigate, beforeNavigate, pushState } from "$app/navigation";

  import { writable, type Writable } from "svelte/store";
  import * as Nostr from "nostr-typedef";
  import { nowProgress } from "$lib/stores/stores";
  import { onMount, type SvelteComponent } from "svelte";
  import KindSelect from "./KindSelect.svelte";
  import { locale } from "svelte-i18n";

  let searchWord = "";
  let searchKind: number | undefined = undefined;
  let searchPubkey = "";
  let searchSince: number | undefined;
  let searchUntil: number | undefined;
  let searchHashtag: string | undefined;
  let searchPubkeyTo: string = "";
  let followee = false;
  const filters: Writable<Nostr.Filter[]> = writable([]);
  let showFilters: Nostr.Filter[];

  let compRef: SvelteComponent;
  let openSearchResult = false;

  function updateQueryParams() {
    const params = new URLSearchParams(window.location.search);
    searchHashtag ? params.set("t", searchHashtag) : params.delete("t");
    searchWord ? params.set("word", searchWord) : params.delete("word");
    searchKind !== undefined
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
    // const params = get(page).url.searchParams;
    const params = new URLSearchParams(window.location.search);
    console.log(params);

    searchHashtag = params.get("t") ?? undefined;
    searchWord = params.get("word") ?? "";
    searchKind = params.get("k") !== null ? Number(params.get("k")) : undefined;
    searchPubkey = params.get("author") ?? "";
    searchPubkeyTo = params.get("p") ?? "";
    searchSince = params.get("s") ? Number(params.get("s")) : undefined;
    searchUntil = params.get("u") ? Number(params.get("u")) : undefined;
    followee = params.get("f") === "true";
    //kindはデフォ値があるから含めない
    if (
      searchHashtag ||
      searchWord ||
      searchPubkey ||
      searchPubkeyTo ||
      searchSince ||
      searchUntil
    ) {
      createFilter();
      showFilters = $filters.map((filter) => {
        return { ...filter, limit: 50 };
      });
      console.log(showFilters);

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
    searchPubkeyTo ||
    searchSince ||
    searchUntil ||
    followee
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
    $filters = [
      {
        search: searchWord || undefined,

        authors: npubRegex.test(searchPubkey)
          ? [getHex(searchPubkey)]
          : followee
            ? followingList
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
    if (searchKind !== undefined && searchKind !== null) {
      $filters[0].kinds = [searchKind];
    }
    //  const chank = 100;
    //if (!followee || !followingList || followingList?.length < chank) {
    //   $filters = [
    //     {
    //       search: searchWord || undefined,
    //       kinds: [searchKind],
    //       authors: npubRegex.test(searchPubkey)
    //         ? [getHex(searchPubkey)]
    //         : followee
    //           ? followingList
    //           : undefined,
    //       since: !Number.isNaN(searchSince) ? searchSince : undefined,
    //       until: !Number.isNaN(searchUntil) ? searchUntil : undefined,
    //       "#t": searchHashtag ? [searchHashtag] : [],
    //     },
    //   ];
    // } else if (followee && followingList && followingList.length > chank) {
    //   $filters = [];
    //   const splitFollowingList: string[][] = followingList.reduce<string[][]>(
    //     (acc, curr, index) => {
    //       if (index % chank === 0) acc.push([]);
    //       acc[acc.length - 1].push(curr);
    //       return acc;
    //     },
    //     []
    //   );

    //   splitFollowingList.forEach((listSegment) => {
    //     $filters.push({
    //       search: searchWord || undefined,
    //       kinds: [searchKind],
    //       authors: npubRegex.test(searchPubkey)
    //         ? [getHex(searchPubkey)]
    //         : followee
    //           ? listSegment
    //           : undefined,
    //       since: !Number.isNaN(searchSince) ? searchSince : undefined,
    //       until: !Number.isNaN(searchUntil) ? searchUntil : undefined,
    //       "#t": searchHashtag ? [searchHashtag] : [],
    //     });
    //   });
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

  async function handleClickPub(str: string) {
    try {
      const pub = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
      if (pub) {
        if (str === "author") {
          searchPubkey = nip19.npubEncode(pub);
        } else {
          searchPubkeyTo = nip19.npubEncode(pub);
        }
      }
    } catch (error) {
      console.log("failed to get pubkey");
    }
  }

  const getKindLabel = (
    kind: number | undefined,
    locale: string | null | undefined
  ) => {
    if (kind === undefined) return "";
    const kindData = eventKinds.get(kind);
    return kindData ? (locale === "ja" ? kindData.ja : kindData.en) : "";
  };
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
            on:change={createFilter}
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
            <div class="flex align-middle mt-1.5 gap-1 items-center">
              <input
                type="number"
                id="kind"
                class="h-10 w-[120px] rounded-md px-3 py-2 border border-magnum-600 bg-neutral-900"
                placeholder="1"
                min="0"
                bind:value={searchKind}
              />
              <KindSelect bind:selectedKind={searchKind} />
              {getKindLabel(searchKind, $locale)}
            </div>
          </div>
          <div class="flex flex-col items-start justify-center w-full">
            <div class="font-medium text-magnum-400">from</div>
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
                on:click={() => handleClickPub("author")}
                class="h-10 rounded-r-sm bg-magnum-600 px-3 py-2 font-medium text-magnum-200 hover:opacity-75 active:opacity-50"
                >Set My Pubkey</button
              >
            </div>
          </div>
          <div class="flex flex-col items-start justify-center w-full">
            <div class="font-medium text-magnum-400">to</div>
            <div
              class="grid grid-cols-[1fr_auto] mt-1.5 divide-x divide-magnum-500 rounded-md border border-magnum-600 w-full"
            >
              <input
                type="text"
                id="npub"
                class="h-10 px-3 py-2 rounded-md"
                placeholder="npub"
                bind:value={searchPubkeyTo}
              /><button
                on:click={() => handleClickPub("p")}
                class="h-10 rounded-r-sm bg-magnum-600 px-3 py-2 font-medium text-magnum-200 hover:opacity-75 active:opacity-50"
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
      <div class="font-semibold text-magnum-400">Filters</div>
      {#each $filters as filter}
        {JSON.stringify(filter, null, 2)}
      {/each}
    </div>
  </div>
  <button
    class="rounded-md bg-magnum-200 px-3 w-40 py-3 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25"
    disabled={$nowProgress}
    on:click={handleClickSearch}>Search</button
  >
</section>
{#if openSearchResult}
  <SearchResult bind:this={compRef} bind:filters={showFilters} />
{/if}
