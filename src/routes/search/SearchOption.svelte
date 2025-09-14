<script lang="ts">
  import { nowProgress, toastSettings } from "$lib/stores/stores";

  import {
    Share,
    Search,
    CircleQuestionMark,
    CalendarClock,
  } from "lucide-svelte"; // CalendarClockを追加

  import * as nip19 from "nostr-tools/nip19";

  import { t as _ } from "@konemono/svelte5-i18n";
  import { page } from "$app/state";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import { tick, untrack } from "svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import UserPicker from "$lib/components/UserPicker.svelte";
  import DatePicker from "$lib/components/Elements/DatePicker.svelte";
  import DateTimeInput from "./DateTimeInput.svelte";
  import DateTimePicker from "$lib/components/DateTimePicker.svelte";

  interface Props {
    searchWord: string | undefined;
    followee: boolean;
    excludeProxy: boolean;
    createFilter: (ward: string) => void;

    resetValue: () => void;
    handleClickSearch: () => void;
  }

  let {
    searchWord = $bindable(),
    followee = $bindable(),
    createFilter,
    excludeProxy = $bindable(),

    resetValue,
    handleClickSearch,
  }: Props = $props();

  let showSyntaxHelp: (bool: boolean) => void = $state(() => {});
  let showTimePicker: (bool: boolean) => void = $state(() => {}); // 新しい状態変数
  let inputElement: HTMLTextAreaElement;
  let lastCursorPosition = 0;

  // 統合検索から従来フィールドへの同期
  $effect(() => {
    if (searchWord) {
      untrack(() => {
        if (searchWord) {
          console.log(searchWord);
          createFilter(searchWord);
        }
      });
    }
  });

  // カーソル位置を記録する関数
  function updateCursorPosition(event: Event) {
    const target = event.target as HTMLInputElement;
    lastCursorPosition = target.selectionStart || 0;
  }

  async function inputUserPub(pubhex: string) {
    if (!inputElement) return;

    const currentValue = searchWord || "";
    const cursorPos = lastCursorPosition;

    const beforeCursor = currentValue.slice(0, cursorPos);
    const afterCursor = currentValue.slice(cursorPos);

    // npubエンコード
    let userIdentifier: string;
    try {
      userIdentifier = nip19.npubEncode(pubhex);
    } catch {
      userIdentifier = pubhex;
    }

    // 直前が:ならauthor:を付けない
    let insertToken = beforeCursor.endsWith(":")
      ? userIdentifier
      : `author:${userIdentifier}`;

    // 直前が空白でも:でもなければスペースを入れる
    if (
      beforeCursor.length > 0 &&
      !/\s$/.test(beforeCursor) &&
      !beforeCursor.endsWith(":")
    ) {
      insertToken = " " + insertToken;
    }

    const newValue = beforeCursor + insertToken + afterCursor;
    searchWord = newValue;

    const newCursorPos = beforeCursor.length + insertToken.length;
    await tick();

    if (inputElement) {
      inputElement.focus();
      inputElement.setSelectionRange(newCursorPos, newCursorPos);
    }
  }

  function handleDateTimeChange(date: Date) {
    console.log(date);
    // until: キーワードの形式を作成
    const untilKeyword = `until:${date.toISOString().slice(0, 19)}`;

    // 既存の until: キーワードを検索して置換
    const existingUntilRegex = /\s*until:\S+/;
    if (searchWord && existingUntilRegex.test(searchWord)) {
      searchWord = searchWord.replace(existingUntilRegex, ` ${untilKeyword}`);
    } else {
      // untilが存在しない場合、末尾に追加
      if (searchWord && searchWord.trim() !== "") {
        searchWord = `${searchWord.trim()} ${untilKeyword}`;
      } else {
        searchWord = untilKeyword;
      }
    }
    showTimePicker(false); // ポップオーバーを閉じる
  }

  async function handleClickShare() {
    const shareData = { url: sharaParam() };
    try {
      await navigator.share(shareData);
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

    if (searchWord && searchWord.trim()) {
      params.set("q", searchWord.trim());
    } else {
      params.delete("q");
    }

    followee ? params.set("f", "1") : params.delete("f");
    excludeProxy ? params.set("x", "1") : params.delete("x");

    return url.toString();
  }

  function handleResetValue() {
    searchWord = "";
    resetValue();
  }

  function handleUnifiedSearch() {
    if (searchWord || "".trim()) {
      handleClickSearch();
    }
  }

  const syntaxExamples = [
    "nostr author:npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw kind:1",
    "#lumilumi kinds:1",
    "nostr p:npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw until:2025-01-01",
    "id:nevent1qvzqqqqqqypzpp9sc34tdxdvxh4jeg5xgu9ctcypmvsg0n00vwfjydkrjaqh0qh4qys8wumn8ghj7un9d3shjtt2wqhxummnw3ezuamfwfjkgmn9wshx5uqpz9mhxue69uhkuenjv4kxz7fwv9c8qqpqyy4tksfxhc2tew78a6t24x0wwqsfwhzt80geraeq4sysrtke0qnq2t44at",
    "kind:0 until:2025-01-01T18:30:00",
    "e:note10kw6pxzztsuvz4mqxfaze7jjwm44d4mcyt4xejdgdvtkqc5p80zs2ps8aj",
  ];
</script>

<div
  class="mt-1 grid grid-cols-[1fr_auto_auto_auto] w-full gap-1 mb-1 overflow-x-hidden"
>
  <div class="w-full flex flex-col items-start justify-center">
    <div class="w-full relative">
      <textarea
        bind:this={inputElement}
        id="unified-search"
        class="w-full rounded-md px-3 py-2 border border-magnum-500 font-mono text-sm resize-y h-20 bg-neutral-800"
        placeholder="nostr author:npub1xxx kind:1 #nostr until:2025-01-01"
        bind:value={searchWord}
        onkeydown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleUnifiedSearch();
          }
        }}
        onselect={updateCursorPosition}
        onclick={updateCursorPosition}
        onkeyup={updateCursorPosition}
      ></textarea>
      <div class="flex gap-2 justify-between">
        <UserPicker onClickUser={inputUserPub} />
        <div class="flex gap-2">
          <Popover
            bind:openPopover={showTimePicker}
            ariaLabel="DateTimeInput"
            zIndex={10}
          >
            <div
              class="text-magnum-400 hover:text-magnum-200 transition-colors cursor-pointer"
            >
              <CalendarClock size={18} />
            </div>
            {#snippet popoverContent()}
              <div class="flex flex-col items-start max-w-[600px] p-2">
                <DateTimePicker onChange={handleDateTimeChange} />
              </div>
            {/snippet}
          </Popover>

          <Popover
            bind:openPopover={showSyntaxHelp}
            ariaLabel="SyntaxHelp"
            zIndex={10}
          >
            <div
              class="text-magnum-400 hover:text-magnum-200 transition-colors"
            >
              <CircleQuestionMark size={18} />
            </div>

            {#snippet popoverContent()}
              <div class="flex flex-col items-start max-w-[600px]">
                <div class="font-medium mb-2 text-magnum-200">
                  {$_("search.syntaxExamplesTitle")}
                </div>

                {#each syntaxExamples as example}
                  <button
                    class="font-mono text-magnum-300 mb-2 cursor-pointer transition-colors
          text-start p-2 rounded-md w-full
            bg-none hover:bg-magnum-700/50 whitespace-pre-wrap break-words"
                    style="word-break: break-word;"
                    onclick={() => {
                      searchWord = example;
                      showSyntaxHelp(false);
                    }}
                  >
                    {example}
                  </button>
                {/each}

                <div
                  class="text-xs text-magnum-400 mt-2 whitespace-pre-wrap break-words"
                  style="word-break: break-word;"
                >
                  {$_("search.syntaxProperties")}
                </div>
              </div>
            {/snippet}
          </Popover>
        </div>
      </div>
    </div>

    {#if followList.get() !== undefined && followList.get().size > 0 && page.url.searchParams.get("load") !== "false"}
      <div class="py-2 self-start">
        <label class="justify-center flex items-center gap-1">
          <input
            type="checkbox"
            class="rounded-checkbox"
            bind:checked={followee}
            onchange={() => {
              if (searchWord) {
                createFilter(searchWord);
              }
            }}
          />
          {$_("search.followee")}
        </label>
      </div>
    {/if}

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
</div>
<div class="flex gap-2">
  <button
    class="h-10 rounded-md bg-magnum-200 w-20 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25 flex items-center justify-center"
    disabled={$nowProgress}
    onclick={handleUnifiedSearch}
  >
    <Search />{$_("search.search")}
  </button>

  <button
    class="w-10 h-10 text-xs text-center flex flex-col items-center justify-center rounded-full border border-magnum-300 text-magnum-300 hover:opacity-75 active:opacity-50 disabled:opacity-25"
    onclick={handleClickShare}
    disabled={$nowProgress}
  >
    <Share size={16} />{$_("about.share")}
  </button>
</div>
