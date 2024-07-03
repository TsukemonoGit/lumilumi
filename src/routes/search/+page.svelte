<script lang="ts">
  import DateRangePicker from "$lib/components/Elements/DateRangePicker.svelte";
  import { createCollapsible, melt } from "@melt-ui/svelte";
  import { X, ChevronsUpDown } from "lucide-svelte";
  import { slide } from "svelte/transition";
  import type { Filter } from "nostr-typedef";
  import { getFollowingList } from "$lib/func/nostr";
  import { nip50relays, npubRegex } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import SearchResult from "./SearchResult.svelte";
  import { SvelteComponent } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { page } from "$app/stores";

  let searchWord: string = "";
  let searchKind: number = 1;
  let searchPubkey: string = "";
  let searchSince: number | undefined;
  let searchUntil: number | undefined;
  let followee: boolean = false;
  let filter: Filter;
  let showFilter: Filter;

  let compRef: SvelteComponent;
  let openSearchResult: boolean = false;

  afterNavigate(async () => {
    compRef?.$destroy();
    const params = $page.url.searchParams;
    const hashtag = params.get("t");
    console.log(hashtag);
    if (hashtag) {
      filter = {
        kinds: [1],
        "#t": [hashtag],
      };

      handleClickSearch();
    }
  });

  beforeNavigate(() => {
    console.log("destroy");

    compRef?.$destroy();
  });

  $: followingList = getFollowingList();
  $: {
    filter = {
      search: searchWord !== "" ? searchWord : undefined,
      kinds: searchKind !== null ? [searchKind] : [1],
      authors: npubRegex.test(searchPubkey)
        ? [getHex(searchPubkey)]
        : followee
          ? followingList
          : undefined,
      since: !Number.isNaN(searchSince) ? searchSince : undefined,
      until: !Number.isNaN(searchUntil) ? searchUntil : undefined,
    };
  }
  //nip50relays

  $: console.log(searchSince);
  $: console.log(searchUntil);
  // $: console.log(followee);
  const {
    elements: { root, content, trigger },
    states: { open },
  } = createCollapsible({
    forceVisible: true,
  });
  const getHex = (str: string): string => {
    try {
      return nip19.decode(searchPubkey).data as string;
    } catch (error) {
      console.log("pubkey error");
      return "";
    }
  };

  //filterによってイベントを取得して表示する
  //inputをちぇっくしたりする
  const handleClickSearch = () => {
    showFilter = { ...filter, limit: 30 };
    console.log(showFilter);
    if (openSearchResult) {
      compRef.$destroy();
      openSearchResult = false;
      // 次のティックでコンポーネントを再表示
      setTimeout(() => {
        openSearchResult = true;
      }, 10);
    } else {
      openSearchResult = true;
    }
  };

  const resetValue = () => {
    searchSince = undefined;
    searchUntil = undefined;
  };
</script>

<svelte:head>
  <title>Lumilumi-Search</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>

<section>
  <div class="container flex gap-2">
    <div class=" font-medium text-magnum-400">SearchRelays</div>
    <div class="text-sm">
      {nip50relays.join(", ")}
    </div>
  </div>
  <div class="flex flex-wrap gap-2 container mb-2">
    <div class="flex flex-col items-start justify-center">
      <div class=" font-medium text-magnum-400">keyword</div>
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

  <div use:melt={$root} class=" container relative w-full">
    <button
      use:melt={$trigger}
      class="flex w-full items-center justify-between bg-magnum-900/50 p-1 rounded-md"
    >
      <span class="font-semibold text-magnum-400"> Options </span>
      <button
        class="relative h-8 w-8 place-items-center rounded-md text-sm
        shadow hover:opacity-75 data-[disabled]:cursor-not-allowed
        data-[disabled]:opacity-75 bg-magnum-600"
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
          class="flex gap-2 w-full flex-wrap container"
        >
          <div class="flex flex-col items-start justify-center">
            <div class=" font-medium text-magnum-400">kind</div>

            <input
              type="number"
              id="kind"
              class="h-10 w-[120px] rounded-md px-3 py-2 border border-magnum-500 bg-neutral-900 mt-1.5"
              placeholder="1"
              min="0"
              bind:value={searchKind}
            />
          </div>
          <div class="flex flex-col items-start justify-center w-full">
            <div class=" font-medium text-magnum-400">pubkey</div>

            <input
              type="text"
              id="npub"
              class="h-10 w-full max-w-[360px] rounded-md px-3 py-2 border border-magnum-500 mt-1.5"
              placeholder="npub"
              bind:value={searchPubkey}
            />
          </div>
          <!-- <div class="flex flex-col items-start justify-center">
            <DatePicker
              bind:value={searchSince}
              title={"Since"}
              maxValue={$searchUntil ? $searchUntil : undefined}
            />
          </div> -->
          <div class="flex flex-row items-start justify-center">
            <DateRangePicker
              bind:startTimeUnix={searchSince}
              bind:endTimeUnix={searchUntil}
              title={"Date"}
            />
            <button
              on:click={resetValue}
              class="h-8 w-8 place-items-center rounded-md text-sm
        shadow hover:opacity-75 data-[disabled]:cursor-not-allowed
        data-[disabled]:opacity-75 bg-magnum-600 justify-center inline-flex mt-auto mb-1 ml-1"
            >
              <X class="size-5" /></button
            >
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="container w-full">
    <div
      class="border border-magnum-700 rounded-md max-h-40 break-all overflow-y-auto m-1 p-1"
    >
      <div class="font-semibold text-magnum-400">Filter</div>
      {JSON.stringify(filter, null, 2)}
    </div>
  </div>
  <button
    class=" rounded-md bg-magnum-200 px-3 py-2 font-medium text-magnum-900 hover:opacity-75 active:opacity-50"
    on:click={handleClickSearch}>Search</button
  >
</section>
{#if openSearchResult}
  <SearchResult bind:this={compRef} filter={showFilter} />
{/if}
