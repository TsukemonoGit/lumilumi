<script lang="ts">
  import { nowProgress, toastSettings } from "$lib/stores/stores";

  import {
    Share,
    Search,
    CircleQuestionMark,
    CalendarClock,
    Braces,
  } from "lucide-svelte"; // CalendarClockを追加

  import * as nip19 from "nostr-tools/nip19";

  import { t as _ } from "@konemono/svelte5-i18n";
  import { page } from "$app/state";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import { tick, untrack } from "svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import UserPicker from "$lib/components/UserPicker.svelte";

  import DateTimePicker from "$lib/components/DateTimePicker.svelte";
  import KindSelect from "./KindSelect.svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    searchWord: string | undefined;
    followee: boolean;
    excludeProxy: boolean;
    createFilter: (ward: string) => void;

    resetValue: () => void;
    handleClickSearch: () => void;
    filters: Nostr.Filter[];
  }

  let {
    searchWord = $bindable(),
    followee = $bindable(),
    createFilter,
    excludeProxy = $bindable(),

    resetValue,
    handleClickSearch,
    filters,
  }: Props = $props();

  let showSyntaxHelp: (bool: boolean) => void = $state(() => {});
  let showTimePicker: (bool: boolean) => void = $state(() => {});
  let showFilter: (bool: boolean) => void = $state(() => {});

  let inputElement: HTMLTextAreaElement;
  let lastCursorPosition = 0;
  let selectedKind: string | undefined = $state("");

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
      : `author:${userIdentifier} `;

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
    // DateをUNIXタイムスタンプ（秒）に変換
    const unixTimestamp = Math.floor(date.getTime() / 1000);
    const untilKeyword = `until:${unixTimestamp} `;

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

  /* function handleResetValue() {
    searchWord = "";
    resetValue();
  } */

  function handleUnifiedSearch() {
    if (searchWord || "".trim()) {
      handleClickSearch();
    }
  }

  const syntaxExamples: { example: string; description: string }[] = [
    {
      example:
        "lumilumi author:npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw",
      description: $_("search.syntaxExample.userPosts"), // 特定ユーザーの投稿
    },
    {
      example:
        "author:npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw kind:1 until:2025-01-01",
      description: $_("search.syntaxExample.userPostsUntil"), // ユーザーのテキスト投稿を指定日まで
    },
    {
      example:
        "id:nevent1qvzqqqqqqypzpp9sc34tdxdvxh4jeg5xgu9ctcypmvsg0n00vwfjydkrjaqh0qh4qys8wumn8ghj7un9d3shjtt2wqhxummnw3ezuamfwfjkgmn9wshx5uqpz9mhxue69uhkuenjv4kxz7fwv9c8qqpqyy4tksfxhc2tew78a6t24x0wwqsfwhzt80geraeq4sysrtke0qnq2t44at",
      description: $_("search.syntaxExample.noteItself"), // 特定ノートそのもの
    },
    {
      example:
        "e:note10kw6pxzztsuvz4mqxfaze7jjwm44d4mcyt4xejdgdvtkqc5p80zs2ps8aj",
      description: $_("search.syntaxExample.noteReactions"), // 特定ノートへの反応
    },
    {
      example: "#lumilumi kind:1",
      description: $_("search.syntaxExample.taggedPosts"), // 特定タグを含むテキスト投稿
    },
    {
      example: "kind:0 until:2025-01-01T18:30:00",
      description: $_("search.syntaxExample.profileUntil"), // プロフィール情報を指定日時まで
    },
  ];

  $effect(() => {
    if (selectedKind !== undefined && selectedKind !== "") {
      untrack(() => {
        const kindValue = selectedKind;
        let newValue = searchWord || "";

        // 直前が kind: の場合はそのまま追加
        const kindRegex = /kind:(\S+)/g;
        const lastKindMatch = Array.from(newValue.matchAll(kindRegex)).pop();

        if (lastKindMatch) {
          // 既存の kind にスペースで追加
          const insertPos = lastKindMatch.index! + lastKindMatch[0].length;
          newValue =
            newValue.slice(0, insertPos) +
            ` kind:${kindValue} ` +
            newValue.slice(insertPos);
        } else {
          // kind: がなければ新しく追加
          newValue = newValue.trim()
            ? `${newValue.trim()} kind:${kindValue} `
            : `kind:${kindValue} `;
        }

        searchWord = newValue;
      });
    }
  });
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
        <div class="flex gap-2">
          <KindSelect bind:selectedKind />
          <UserPicker onClickUser={inputUserPub} />

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
        </div>

        <div class="flex gap-2">
          <Popover
            bind:openPopover={showFilter}
            ariaLabel="search filter"
            zIndex={10}
          >
            <div
              class="text-magnum-400 hover:text-magnum-200 transition-colors cursor-pointer"
            >
              <Braces size={18} />
            </div>
            {#snippet popoverContent()}
              <div
                class="border border-magnum-500/80 rounded-md max-h-60 break-all overflow-y-auto p-1 w-[360px]"
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
                <!-- プロパティ説明セクション -->
                <div class="font-medium mb-2 text-magnum-200">
                  {$_("search.syntaxPropertiesTitle")}
                </div>

                <div
                  class="text-xs text-magnum-400 mb-3 whitespace-pre-wrap break-words"
                  style="word-break: break-word;"
                >
                  {$_("search.syntaxPropertiesDescription")}
                </div>

                <ul class="list-disc list-inside text-sm text-magnum-300 mb-2">
                  <li>
                    author/authors: {$_("search.propertyDescription.author")}
                  </li>
                  <li>kind/kinds: {$_("search.propertyDescription.kind")}</li>
                  <li>id/ids: {$_("search.propertyDescription.id")}</li>
                  <li>until: {$_("search.propertyDescription.until")}</li>
                  <li>p: {$_("search.propertyDescription.mention")}</li>
                  <li>e/q: {$_("search.propertyDescription.quote")}</li>
                  <li>t: {$_("search.propertyDescription.hashtag")}</li>
                  <li>r: {$_("search.propertyDescription.url")}</li>
                </ul>

                <div class="text-xs text-magnum-400 mb-6">
                  {$_("search.propertyDescription.oneCharOthers")}
                </div>

                <!-- 例セクション -->
                <div class="font-medium mb-2 text-magnum-200">
                  {$_("search.syntaxExamplesTitle")}
                </div>

                <div class="w-full space-y-1 max-h-60 overflow-y-auto">
                  {#each syntaxExamples as { example, description }}
                    <button
                      type="button"
                      class="font-mono text-magnum-300 cursor-pointer transition-colors text-start p-2 rounded-md w-full bg-none border border-magnum-700 hover:bg-magnum-700/50 break-words"
                      style="word-break: break-word;"
                      onclick={() => {
                        searchWord = example;
                        showSyntaxHelp(false);
                      }}
                    >
                      <div class="text-xs text-magnum-400 mb-1">
                        {description}
                      </div>
                      <div class="text-sm">{example}</div>
                    </button>
                  {/each}
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
    class="h-10 rounded-md bg-magnum-200 w-32 font-medium text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-25 flex items-center justify-center"
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
