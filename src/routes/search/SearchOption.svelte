<script lang="ts">
  import DateRangePicker from "$lib/components/Elements/DateRangePicker.svelte";
  import { nowProgress, toastSettings } from "$lib/stores/stores";
  import { Collapsible } from "melt/builders";
  import { X, Share, Search, ChevronDown } from "lucide-svelte";
  import { locale } from "svelte-i18n";
  import { slide } from "svelte/transition";
  import KindSelect from "./KindSelect.svelte";
  import * as Nostr from "nostr-typedef";

  import UserDataList from "$lib/components/NostrElements/UserDataList.svelte";
  import { eventKinds } from "$lib/func/kinds";
  import { _ } from "svelte-i18n";
  import { page } from "$app/state";
  import { followList } from "$lib/stores/globalRunes.svelte";

  interface Props {
    searchWord: string | undefined;
    followee: boolean;
    createFilter: () => void;
    searchKind: number | undefined;
    searchPubkey: string | undefined;
    searchPubkeyTo: string | undefined;
    searchHashtag: string | undefined;
    searchSince: number | undefined;
    searchUntil: number | undefined;
    resetValue: () => void;
    filters: Nostr.Filter[];
    handleClickSearch: () => void;
  }

  let {
    searchWord = $bindable(),
    followee = $bindable(),
    createFilter,
    searchKind = $bindable(undefined),
    searchPubkey = $bindable(),
    searchPubkeyTo = $bindable(),
    searchHashtag = $bindable(),
    searchSince = $bindable(),
    searchUntil = $bindable(),
    resetValue,
    filters,
    handleClickSearch,
  }: Props = $props();

  const getKindLabel = (
    kind: number | undefined,
    locale: string | null | undefined
  ) => {
    if (kind === undefined) return "";
    const kindData = eventKinds.get(kind);
    return kindData ? (locale === "ja" ? kindData.ja : kindData.en) : "";
  };
  const collapsible = new Collapsible();

  const handleClickUser = (pubkey: string) => {
    console.log(pubkey);
    searchPubkey = pubkey;
  };

  const handleClickSearchPubkeyTo = (pubkey: string) => {
    console.log(pubkey);
    searchPubkeyTo = pubkey;
  };

  async function handleClickShare() {
    const shareData = { url: sharaParam() };
    console.log(page.url);
    try {
      await navigator.share(shareData);
      // await navigator.clipboard.writeText(
      //   `${page.url.origin}/channel/${nevent}`
      // );
      // $toastSettings = {
      //   title: "Success",
      //   description: `shared successfully`,
      //   color: "bg-green-500",
      // };
    } catch (error: any) {
      console.error(error.message);
      $toastSettings = {
        title: "Error",
        description: "Failed to share",
        color: "bg-orange-500",
      };
    }
  }

  function sharaParam() {
    const url = new URL(page.url.origin + page.url.pathname);
    const params = url.searchParams;

    searchHashtag ? params.set("t", searchHashtag) : params.delete("t");
    searchWord ? params.set("word", searchWord) : params.delete("word");
    searchKind !== undefined && searchKind !== null
      ? params.set("k", String(searchKind))
      : params.delete("k");
    searchPubkey ? params.set("author", searchPubkey) : params.delete("author");
    searchPubkeyTo ? params.set("p", searchPubkeyTo) : params.delete("p");
    searchSince ? params.set("s", String(searchSince)) : params.delete("s");
    searchUntil ? params.set("u", String(searchUntil)) : params.delete("u");
    followee ? params.set("f", String(followee)) : params.delete("f");

    console.log(url.toString());
    return url.toString();
  }
</script>

<div
  class="mt-1 grid grid-cols-[1fr_auto_auto] w-full gap-1 mb-1 overflow-x-hidden"
>
  <div class="w-full flex flex-col items-start justify-center">
    <input
      type="text"
      id="search"
      class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500"
      placeholder="search"
      bind:value={searchWord}
    />
    {#if followList.get() !== undefined && followList.get().size > 0 && page.url.searchParams.get("load") !== "false"}
      <div class="py-2 self-start">
        <label class="justify-center flex items-center gap-1">
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={followee}
            onchange={createFilter}
          />
          {$_("search.followee")}
        </label>
      </div>{/if}
  </div>
  <button
    class="h-10 rounded-md bg-magnum-200 w-20 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25 flex items-center justify-center"
    disabled={$nowProgress}
    onclick={handleClickSearch}><Search />{$_("search.search")}</button
  >

  <button
    class=" w-10 h-10 text-xs text-center flex flex-col items-center justify-center rounded-full border border-magnum-300 text-magnum-300 hover:opacity-75 active:opacity-50 disabled:opacity-25"
    onclick={handleClickShare}
    disabled={$nowProgress}
    ><Share size={16} />{$_("about.share")}
  </button>
</div>

<button
  {...collapsible.trigger}
  class="flex items-center border-b border-b-magnum-400 self-start mt-1"
>
  <span class="font-semibold text-magnum-400 p-1">{$_("search.options")}</span>
  <div
    class="relative h-6 w-6 place-items-center rounded-full text-sm shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 bg-magnum-600 flex justify-center"
    aria-label="Toggle"
  >
    <div class="w-fit h-fit flex justify-center items-center">
      {#if collapsible.open}
        <X class="size-5" />
      {:else}
        <ChevronDown class="size-5" />
      {/if}
    </div>
  </div>
</button>

{#if collapsible.open}
  <div
    {...collapsible.content}
    transition:slide
    class="flex gap-2 w-full flex-wrap px-2"
  >
    <div class="flex flex-col items-start justify-center mt-2">
      <div class="font-medium text-magnum-400">kind</div>
      <div class="flex align-middle mt-1.5 gap-1 items-center">
        <input
          type="number"
          id="kind"
          class="h-10 w-[120px] rounded-md px-3 py-2 border border-magnum-400/60"
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
        class="grid grid-cols-[auto_1fr] mt-1.5 divide-x divide-magnum-400/60 rounded-md border border-magnum-400/60 w-full"
      >
        <UserDataList {handleClickUser} />

        <input
          type="text"
          id="npub"
          class="h-10 px-3 py-2 rounded-r-md"
          placeholder="npub"
          bind:value={searchPubkey}
        />
      </div>
    </div>
    <div class="flex flex-col items-start justify-center w-full">
      <div class="font-medium text-magnum-400">to</div>
      <div
        class="grid grid-cols-[auto_1fr] mt-1.5 divide-x divide-magnum-400/60 rounded-md border border-magnum-400/60 w-full"
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
        class="h-10 w-full px-3 py-2 rounded-md border border-magnum-400/60"
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
        onclick={resetValue}
        class="h-8 w-8 place-items-center rounded-md text-sm shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 bg-magnum-600 justify-center inline-flex mt-auto mb-1 ml-1"
      >
        <X class="size-5" /></button
      >
    </div>
  </div>
{/if}
