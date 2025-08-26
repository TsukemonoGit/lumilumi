<script lang="ts">
  import { nowProgress, toastSettings } from "$lib/stores/stores";
  import { createCollapsible, melt } from "@melt-ui/svelte";
  import { X, Share, Search, ChevronDown } from "lucide-svelte";
  import { locale } from "@konemono/svelte5-i18n";
  import { slide } from "svelte/transition";
  import KindSelect from "./KindSelect.svelte";
  import DateTimeInput from "./DateTimeInput.svelte";
  import * as Nostr from "nostr-typedef";

  import UserDataList from "$lib/components/NostrElements/UserDataList.svelte";
  import { eventKinds } from "$lib/func/kinds";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { page } from "$app/state";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import { onMount, untrack } from "svelte";

  interface Props {
    searchWord: string | undefined;
    followee: boolean;
    excludeProxy: boolean;
    createFilter: () => void;
    searchKind: number | undefined;
    searchPubkey: string | undefined;
    searchPubkeyTo: string | undefined;
    searchHashtag: string | undefined;
    searchUntil: number | undefined;
    resetValue: () => void;
    handleClickSearch: () => void;
  }

  let {
    searchWord = $bindable(),
    followee = $bindable(),
    createFilter,
    excludeProxy = $bindable(),
    searchKind = $bindable(undefined),
    searchPubkey = $bindable(),
    searchPubkeyTo = $bindable(),
    searchHashtag = $bindable(),
    searchUntil = $bindable(),
    resetValue,
    handleClickSearch,
  }: Props = $props();

  let searchUntilDate = $state("");
  let searchUntilTime = $state("");
  onMount(() => {
    if (searchUntil) {
      const date = new Date(searchUntil * 1000);
      searchUntilDate = date.toISOString().split("T")[0];
      searchUntilTime = date.toTimeString().split(" ")[0].substring(0, 5);
    }
  });
  // 日付と時刻を組み合わせてUnixタイムスタンプに変換
  $effect(() => {
    if (searchUntilDate && searchUntilTime) {
      untrack(() => {
        const dateTime = new Date(`${searchUntilDate}T${searchUntilTime}`);
        searchUntil = Math.floor(dateTime.getTime() / 1000);
      });
    } else if (!searchUntilDate && !searchUntilTime) {
      untrack(() => {
        searchUntil = undefined;
      });
    }
  });

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

  async function handleClickShare() {
    const shareData = { url: sharaParam() };
    console.log(page.url);
    try {
      await navigator.share(shareData);
    } catch  {
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

    if (searchHashtag) {
      params.set("t", searchHashtag);
    } else {
      params.delete("t");
    }
    if (searchWord) {
      params.set("word", searchWord);
    } else {
      params.delete("word");
    }
    if (searchKind !== undefined && searchKind !== null) {
      params.set("k", String(searchKind));
    } else {
      params.delete("k");
    }
    if (searchPubkey) {
      params.set("author", searchPubkey);
    } else {
      params.delete("author");
    }
    if (searchPubkeyTo) {
      params.set("p", searchPubkeyTo);
    } else {
      params.delete("p");
    }
    if (searchUntil) {
      params.set("u", String(searchUntil));
    } else {
      params.delete("u");
    }
    if (followee) {
      params.set("f", String(followee));
    } else {
      params.delete("f");
    }

    console.log(url.toString());
    return url.toString();
  }

  function handleResetValue() {
    searchUntilDate = "";
    searchUntilTime = "";
    resetValue();
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
    <div class="py-2 self-start">
      <label class="justify-center flex items-center gap-1">
        <input
          type="checkbox"
          class="rounded-checkbox"
          bind:checked={excludeProxy}
        />
        {$_("search.excludeproxynote")}
      </label>
    </div>
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
<div use:melt={$root} class="relative w-full mt-1">
  <button
    use:melt={$trigger}
    class="flex items-center justify-between border-b border-b-magnum-400"
  >
    <span class="font-semibold text-magnum-400 p-1">{$_("search.options")}</span
    >
    <div
      class="relative h-6 w-6 place-items-center rounded-full text-sm shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 bg-magnum-600 flex justify-center"
      aria-label="Toggle"
    >
      <div class="w-fit h-fit flex justify-center items-center">
        {#if $open}
          <X class="size-5" />
        {:else}
          <ChevronDown class="size-5" />
        {/if}
      </div>
    </div>
  </button>

  <div>
    {#if $open}
      <div
        use:melt={$content}
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
        <div class="flex flex-row items-start justify-center gap-2">
          <DateTimeInput
            bind:dateValue={searchUntilDate}
            bind:timeValue={searchUntilTime}
          />
          <button
            onclick={handleResetValue}
            class="h-8 w-8 place-items-center rounded-md text-sm shadow hover:opacity-75 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-75 bg-magnum-600 justify-center inline-flex mt-auto mb-1 ml-1"
          >
            <X class="size-5" /></button
          >
        </div>
      </div>
    {/if}
  </div>
</div>
