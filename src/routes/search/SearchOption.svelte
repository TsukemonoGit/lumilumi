<script lang="ts">
  import DateRangePicker from "$lib/components/Elements/DateRangePicker.svelte";
  import { followList, nowProgress } from "$lib/stores/stores";
  import { createCollapsible, melt } from "@melt-ui/svelte";
  import { X, ChevronsUpDown } from "lucide-svelte";
  import { locale } from "svelte-i18n";
  import { slide } from "svelte/transition";
  import KindSelect from "./KindSelect.svelte";
  import * as Nostr from "nostr-typedef";
  import type { Writable } from "svelte/store";
  import UserDataList from "$lib/components/NostrElements/UserDataList.svelte";
  import { eventKinds } from "$lib/func/kinds";

  export let searchWord: string | undefined;
  export let followee: boolean;
  export let createFilter;
  export let searchKind: number | undefined = undefined;
  export let searchPubkey: string | undefined;
  export let searchPubkeyTo: string | undefined;
  export let searchHashtag: string | undefined;
  export let searchSince: number | undefined;
  export let searchUntil: number | undefined;
  export let resetValue;
  export let filters: Writable<Nostr.Filter[]>;
  export let handleClickSearch;

  const getKindLabel = (
    kind: number | undefined,
    locale: string | null | undefined
  ) => {
    if (kind === undefined) return "";
    const kindData = eventKinds.get(kind);
    return kindData ? (locale === "ja" ? kindData.ja : kindData.en) : "";
  };

  const {
    elements: { root, content, trigger },
    states: { open },
  } = createCollapsible({ forceVisible: true });

  const handleClickUser = (pubkey: string) => {
    console.log(pubkey);
    searchPubkey = pubkey;
  };
  const handleClickSearchPubkeyTo = (pubkey: string) => {
    console.log(pubkey);
    searchPubkeyTo = pubkey;
  };
</script>

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
  {#if $followList !== undefined && $followList.size > 0}
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
    </div>{/if}
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
            class="grid grid-cols-[auto_1fr] mt-1.5 divide-x divide-magnum-500 rounded-md border border-magnum-600 w-full"
          >
            <UserDataList {handleClickUser} />

            <input
              type="text"
              id="npub"
              class="h-10 px-3 py-2 rounded-r-md"
              placeholder="npub"
              bind:value={searchPubkey}
            />

            <!-- <button
              on:click={() => handleClickPub("author")}
              class="h-10 rounded-r-sm bg-magnum-600 px-3 py-2 font-medium text-magnum-200 hover:opacity-75 active:opacity-50"
              >Set My Pubkey</button
            > -->
          </div>
        </div>
        <div class="flex flex-col items-start justify-center w-full">
          <div class="font-medium text-magnum-400">to</div>
          <div
            class="grid grid-cols-[auto_1fr] mt-1.5 divide-x divide-magnum-500 rounded-md border border-magnum-600 w-full"
          >
            <UserDataList handleClickUser={handleClickSearchPubkeyTo} />

            <input
              type="text"
              id="npub"
              class="h-10 px-3 py-2 rounded-r-md"
              placeholder="npub"
              bind:value={searchPubkeyTo}
            />
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
