<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import {
    SmilePlus,
    Send,
    TriangleAlert,
    UserPlus,
    Quote,
    Bell,
    RefreshCw,
  } from "lucide-svelte";
  import {
    getMetadataList,
    type MetadataList,
    type UserData,
  } from "$lib/func/nostr";
  import {
    emojis,
    nowProgress,
    uploader,
    toastSettings,
  } from "$lib/stores/stores";

  import UploaderSelect from "./Elements/UploaderSelect.svelte";
  import MediaPicker from "./Elements/MediaPicker.svelte";
  import { filesUpload, delay, displayShortPub } from "$lib/func/util";

  import type { MargePostOptions } from "$lib/types";
  import { type EventPacket } from "rx-nostr";
  import { writable, type Writable } from "svelte/store";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { nsecRegex } from "$lib/func/regex";
  import { convertMetaTags } from "$lib/func/imeta";
  import UserName from "./NostrElements/user/UserName.svelte";
  import CustomEmoji from "./NostrElements/content/CustomEmoji.svelte";
  import PostPreview from "./PostPreview.svelte";
  import EmojiListUpdate from "./SettingsElements/EmojiListUpdate.svelte";
  import GeohashMap from "./GeohashMap.svelte";
  import { tick, untrack } from "svelte";
  import MakePollUI from "./MakePollUI.svelte";
  import { TokenType, type Token } from "@konemono/nostr-content-parser";
  import { addEmojiTag, checkCustomEmojis } from "$lib/func/customEmoji";
  import CloseButton from "./Elements/CloseButton.svelte";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";

  // ----------------------------------------
  // Component Props
  // ----------------------------------------
  interface Props {
    close: any;
    initOptions: MargePostOptions;
    signPubkey?: string;
    isPosting: boolean;
    additionalReplyUsers: string[];
    resetCreatePost?: () => void;
    onSendEvent: (eventData: {
      text: string;
      tags: string[][];
      onWarning: boolean;
      warningText: string;
      additionalReplyUsers: string[];
    }) => Promise<void>;
    textarea: HTMLTextAreaElement | undefined;
  }

  let {
    close,
    initOptions,
    signPubkey,
    isPosting,
    additionalReplyUsers = $bindable(),
    resetCreatePost = $bindable(),
    onSendEvent,
    textarea = $bindable(),
  }: Props = $props();

  // ----------------------------------------
  // State Management
  // ----------------------------------------
  let text: string = $state(initOptions.content ?? "");
  let tags: string[][] = $state([...(initOptions.tags ?? [])]);
  let geohash: string = $state("");
  let onWarning: boolean = $state<boolean>(
    initOptions.warningText ? true : false
  );
  let warningText = $state(initOptions.warningText || "");
  let customReaction: string = $state("");
  let viewCustomEmojis: boolean = $state<boolean>(false);
  let viewMetadataList: boolean = $state(false);
  let inputMetadata: string = $state("");
  let clickEscape: number = $state(0);
  let nsecCheck = $derived(nsecRegex.test(text) || nsecRegex.test(warningText));

  // DOM references
  let warningTextarea: HTMLInputElement | undefined = $state();
  let emojiInput: HTMLInputElement | undefined = $state();
  let metadataInput: HTMLInputElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();

  // File handling
  let files: FileList | undefined = $state();
  let uploadAbortController: AbortController | null = $state(null);

  // Derived data
  let metadataList: MetadataList = $derived.by(() => {
    if (!viewMetadataList) return {};

    try {
      const metadataStr = localStorage.getItem(STORAGE_KEYS.METADATA);
      if (!metadataStr) return {};

      const metadataQueryData: [QueryKey, EventPacket][] =
        JSON.parse(metadataStr);
      return getMetadataList(metadataQueryData);
    } catch (error) {
      return {};
    }
  });

  // Stores
  const selectedUploader: Writable<string> = writable();

  // Geohash effect
  $effect(() => {
    if (geohash) {
      untrack(() => {
        const filteredTags = tags.filter((tag) => tag[0] !== "g");
        tags = [...filteredTags, ["g", geohash]];
      });
    } else {
      untrack(() => {
        tags = tags.filter((tag) => tag[0] !== "g");
      });
    }
  });

  // Uploader subscription
  selectedUploader.subscribe((value) => {
    if (value) {
      $uploader = value;
    }
  });
  $effect(() => {
    if (textarea) {
      untrack(async () => {
        await tick();
        textarea?.focus();
      });
    }
  });
  // resetCreatePost関数を設定
  $effect(() => {
    resetCreatePost = () => {
      text = "";
      tags = [];
      geohash = "";
      onWarning = false;
      warningText = "";
      customReaction = "";
      viewCustomEmojis = false;
      viewMetadataList = false;
      inputMetadata = "";
      clickEscape = 0;
    };
  });

  // ----------------------------------------
  // Event Publishing
  // ----------------------------------------
  async function postNote() {
    await onSendEvent({
      text,
      tags,
      onWarning,
      warningText,
      additionalReplyUsers,
    });
  }

  // ----------------------------------------
  // Text Handling
  // ----------------------------------------
  async function insertTextAtCursor(
    insertText: string,
    options: {
      addSpaceBefore?: boolean;
      addSpaceAfter?: boolean;
    } = {}
  ) {
    const { addSpaceBefore = false, addSpaceAfter = false } = options;
    const WHITESPACE_REGEX = /^\s+$/;

    const finalInsertText = (() => {
      let result = insertText;
      const isTextStart = textarea?.selectionStart === 0;

      if (addSpaceBefore) {
        if ((!isTextStart && textarea?.selectionStart) || 0 > 0) {
          const prev = text[textarea?.selectionStart || 0 - 1];
          if (!WHITESPACE_REGEX.test(prev)) {
            result = ` ${result}`;
          }
        }
      }

      if (addSpaceAfter) {
        const next = text[textarea?.selectionStart || 0];
        if (!WHITESPACE_REGEX.test(next)) {
          result = `${result} `;
        }
      }

      return result;
    })();

    const insertStart = textarea?.selectionStart || 0;
    const insertEnd = insertStart + finalInsertText.length;
    text =
      text.slice(0, insertStart) + finalInsertText + text.slice(insertStart);

    await tick();
    textarea?.focus();
    textarea?.setSelectionRange(insertEnd, insertEnd);
  }

  function handleClickEmoji(e: string[]) {
    const emoji = [...e];
    const result = addEmojiTag(tags, emoji);
    tags = result.tags;
    // 実際にタグに挿入される名前を使用
    const emojiText = `:${result.finalName}:`;
    insertTextAtCursor(emojiText);
  }

  function handleClickUser(pub: string): Promise<void> {
    insertTextAtCursor(`nostr:${pub}`, {
      addSpaceAfter: true,
      addSpaceBefore: true,
    });
    viewMetadataList = false;
    return Promise.resolve();
  }

  function handleClickQuote() {
    insertTextAtCursor("nostr:", { addSpaceBefore: true });
  }

  // ----------------------------------------
  // File Upload
  // ----------------------------------------
  async function handleFileUpload(fileList: FileList) {
    if (!fileList || fileList.length <= 0 || !$uploader) {
      return;
    }

    if (uploadAbortController) {
      uploadAbortController.abort();
    }

    uploadAbortController = new AbortController();

    try {
      const uploadedURPs = await filesUpload(
        fileList,
        $uploader,
        uploadAbortController.signal
      );

      const promises = uploadedURPs.map(async (data) => {
        if (data.status !== "success") {
          $toastSettings = {
            title: "error",
            description: uploadedURPs[0].message,
            color: "bg-red-400",
          };
          return;
        }
        const url = data.nip94_event?.tags.find((tag) => tag[0] === "url")?.[1];
        if (!url) return;

        if (data.nip94_event) {
          tags.push(convertMetaTags(data.nip94_event));
        }
        await delay(10);
        insertTextAtCursor(url, {
          addSpaceBefore: true,
          addSpaceAfter: true,
        });
        await delay(10);
      });

      await Promise.all(promises);
    } catch (error) {
      console.log(error);
    } finally {
      uploadAbortController = null;
    }
  }

  async function onChangeHandler(e: Event): Promise<void> {
    const _files = (e.target as HTMLInputElement).files;
    if (_files) {
      $nowProgress = true;
      await handleFileUpload(_files);
      $nowProgress = false;
    }
  }

  async function paste(event: ClipboardEvent) {
    if (!event.clipboardData) return;

    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    if (files.length > 0) {
      $nowProgress = true;
      const fileList = new DataTransfer();
      files.forEach((file) => fileList.items.add(file));
      await handleFileUpload(fileList.files);
      $nowProgress = false;
    }
  }

  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      $nowProgress = true;
      await handleFileUpload(event.dataTransfer.files);
      $nowProgress = false;
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // ----------------------------------------
  // UI Interaction
  // ----------------------------------------
  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === "Enter") {
      postNote();
      return;
    }
  }

  async function handleClickCustomReaction() {
    viewCustomEmojis = !viewCustomEmojis;

    if (viewCustomEmojis) {
      await tick();
      emojiInput?.focus();
      emojiInput?.setSelectionRange(0, 0);
    }

    if (viewMetadataList && viewCustomEmojis) {
      viewMetadataList = false;
    }
  }

  async function handleClickMetadata() {
    viewMetadataList = !viewMetadataList;

    if (viewMetadataList) {
      await tick();
      metadataInput?.focus();
      metadataInput?.setSelectionRange(0, 0);
    }

    if (viewMetadataList && viewCustomEmojis) {
      viewCustomEmojis = false;
    }
  }

  function checkUserInput(input: string, userData: UserData) {
    if (input === "") return true;

    const searchTerm = input.toLowerCase();

    return (
      (userData.name && userData.name.toLowerCase().includes(searchTerm)) ||
      (userData.display_name &&
        userData.display_name.toLowerCase().includes(searchTerm)) ||
      (userData.nip05 && userData.nip05.toLowerCase().includes(searchTerm)) ||
      (userData.petname && userData.petname.toLowerCase().includes(searchTerm))
    );
  }

  function userName(pubkey: string, profile: UserData) {
    if (profile.petname) {
      return `📛${profile.petname}`;
    }

    if (
      (!profile.display_name || profile.display_name === "") &&
      (!profile.name || profile.name === "")
    ) {
      return displayShortPub(pubkey);
    }

    return `${profile.display_name ?? ""}${profile.name ? `@${profile.name}` : ""}`;
  }

  function addUser(user: string | undefined) {
    if (!user) return;
    if (
      [
        ...(initOptions?.defaultUsers || []),
        ...(initOptions?.addableUserList || []),
      ]?.includes(user)
    )
      return;

    initOptions = {
      ...initOptions,
      addableUserList: [...(initOptions?.addableUserList ?? []), user],
    };

    additionalReplyUsers = [...(additionalReplyUsers ?? []), user];
  }

  const onPolled = (id: string) => {
    insertTextAtCursor(`nostr:${id}`, {
      addSpaceBefore: true,
      addSpaceAfter: true,
    });
  };
</script>

<svelte:window onkeydown={handleKeyDown} />

<PostPreview
  event={{
    tags,
    content: text,
    kind: initOptions.kind,
    pubkey: signPubkey,
  }}
  {onWarning}
  {warningText}
  {signPubkey}
  replyUsers={[...(initOptions.defaultUsers || []), ...additionalReplyUsers]}
  {addUser}
/>

<div class="relative rounded-md bg-neutral-900 px-6 py-4 shadow-lg">
  <CloseButton useMelt={$close} ariaLabel="close" title="Close (Esc)" />

  <div class="flex flex-row gap-1 md:gap-2 mb-1">
    <button
      onclick={async () => {
        onWarning = !onWarning;
        if (onWarning) {
          await tick();
          warningTextarea?.focus();
        }
      }}
      class="button"
    >
      <TriangleAlert
        size="20"
        class={onWarning ? "stroke-magnum-500  " : "stroke-magnum-300"}
      />
    </button>

    <button
      aria-label="open name list"
      onclick={handleClickQuote}
      class="button"
    >
      <Quote size="20" class="stroke-magnum-300 " />
    </button>

    <UploaderSelect bind:selectedUploader={$selectedUploader} />

    <MediaPicker
      class="button"
      bind:files
      bind:fileInput
      onchange={onChangeHandler}
    />
  </div>

  {#if onWarning}
    <div class="flex">
      <div class="mt-auto mb-auto text-sm break-keep">理由：</div>
      <input
        type="text"
        class="px-1 h-8 w-full rounded-md text-magnum-100 border-2
          border-magnum-400"
        bind:this={warningTextarea}
        bind:value={warningText}
      />
    </div>
  {/if}

  <div class="flex gap-1 mb-0.5 flex-wrap">
    {#if initOptions.defaultUsers && initOptions.defaultUsers.length > 0}
      {#each initOptions.defaultUsers as user}
        <div
          class="text-magnum-100 rounded-md w-fit py-1 flex items-center gap-1"
        >
          <UserName pubhex={user} />
        </div>
      {/each}
    {/if}

    {#if initOptions.addableUserList}
      <div class="flex flex-wrap gap-1">
        {#each initOptions.addableUserList as replyUser, index}
          {#if additionalReplyUsers.includes(replyUser)}
            <button
              class="bg-magnum-600 rounded-md text-magnum-100 w-fit px-2 py-1 flex items-center gap-1 transition-all duration-200 shadow-sm hover:brightness-125"
              onclick={() => {
                additionalReplyUsers = additionalReplyUsers.filter(
                  (user) => user !== replyUser
                );
              }}
              aria-label={`Remove ${replyUser} from reply list`}
            >
              <Bell class="min-w-4 text-magnum-200 fill-magnum-200" />
              <UserName pubhex={replyUser} />
            </button>
          {:else}
            <button
              class="rounded-md border border-magnum-600 text-magnum-100 w-fit px-2 py-1 flex items-center gap-1 transition-all duration-200 shadow-sm hover:bg-magnum-400/25 opacity-75"
              onclick={() => {
                additionalReplyUsers.push(replyUser);
              }}
              aria-label={`Add ${replyUser} to reply list`}
            >
              <Bell class="min-w-4 text-magnum-500 " /><UserName
                pubhex={replyUser}
              />
            </button>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <fieldset class="mb-1 flex items-center gap-5">
    <textarea
      disabled={isPosting}
      class={`inline-flex h-24 w-full flex-1 items-center justify-center rounded-sm border  p-2 leading-none disabled:opacity-20 ${nsecCheck ? "bg-red-500/20" : "bg-neutral-800 "}`}
      id="note"
      bind:this={textarea}
      bind:value={text}
      oninput={async (e) => {
        clickEscape = 0;
        tags = await checkCustomEmojis(tags, text);
      }}
      onclick={(e) => {
        clickEscape = 0;
      }}
      ontouchend={(e) => {
        clickEscape = 0;
      }}
      onpaste={(e) => {
        paste(e);
        clickEscape = 0;
      }}
      ondrop={(e) => {
        handleDrop(e);
        clickEscape = 0;
      }}
      ondragover={(e) => {
        handleDragOver(e);
        clickEscape = 0;
      }}
      placeholder={$_("post.placeholder")}
    ></textarea>
  </fieldset>

  {#if nsecCheck}
    <div class="text-sm text-red-500">
      {$_("post.nsecAlart")}
    </div>
  {/if}

  <div class="mt-2 grid grid-cols-[auto_1fr] gap-1 md:gap-2 items-center">
    <div class="flex items-center gap-1">
      <GeohashMap bind:geohash />
      <MakePollUI {onPolled} />
    </div>
    <div class=" flex justify-end gap-1 md:gap-2 items-center">
      <!--emojis-->
      {#if viewCustomEmojis}
        <input
          bind:this={emojiInput}
          type="email"
          id="emoji"
          class="h-8 w-full rounded-md text-magnum-100 border-2
            border-magnum-400"
          bind:value={customReaction}
        />
      {/if}

      <button
        aria-label="open custom emoji list"
        onclick={handleClickCustomReaction}
        class="button"
      >
        <SmilePlus
          size="20"
          class={viewCustomEmojis ? "stroke-magnum-500" : "stroke-magnum-300"}
        />
      </button>

      <!--userdata-->
      {#if viewMetadataList}
        <input
          bind:this={metadataInput}
          type="text"
          id="npub"
          class="h-8 w-full rounded-md text-magnum-100 border-2
         border-magnum-400"
          bind:value={inputMetadata}
        />
      {/if}
      <button
        aria-label="open name list"
        onclick={handleClickMetadata}
        class="button"
      >
        <UserPlus
          size="20"
          class={viewMetadataList ? "stroke-magnum-500" : "stroke-magnum-300"}
        />
      </button>

      <!---->
      <button
        disabled={isPosting || text.trim() === ""}
        aria-label="post"
        title="Post (Ctrl+Enter)"
        class="sendButton"
        onclick={postNote}
      >
        <Send size="20" class="stroke-zinc-100 " />
      </button>
    </div>
  </div>

  <!--emojis-->
  {#if viewCustomEmojis}
    <div
      class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
      style="overflow-anchor: auto;"
    >
      {#each $emojis.list as e, index}
        {#if customReaction === "" || e[0]
            .toLowerCase()
            .includes(customReaction.replace(":", "").toLowerCase())}
          <button
            aria-label={`Select emoji ${e[0]}`}
            onclick={() => handleClickEmoji(e)}
            class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
          >
            <CustomEmoji
              part={{
                type: TokenType.CUSTOM_EMOJI,
                content: e[0],
                metadata: { name: e[0], url: e[1] },
                start: 0,
                end: 0,
              } as Token}
            />
          </button>
        {/if}
      {/each}<EmojiListUpdate
        buttonClass="ml-auto p-1 m-1 rounded-full   hover:opacity-75 active:opacity-50 bg-magnum-600 text-magnum-200 "
      >
        <RefreshCw />
      </EmojiListUpdate>
    </div>
  {/if}

  <!--metadataList-->
  {#if viewMetadataList}
    <div
      class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
    >
      {#each Object.entries(metadataList) as [pubkey, profile], index}
        {#if checkUserInput(inputMetadata, profile)}
          <button
            aria-label={`Select profile ${profile.display_name || profile.name || pubkey}`}
            onclick={() => handleClickUser(pubkey)}
            class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
          >
            {userName(pubkey, profile)}
          </button>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  .button,
  .sendButton {
    @apply inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-magnum-500
    bg-zinc-900 font-medium leading-none text-zinc-200 hover:opacity-75 active:opacity-50;
  }
  .sendButton {
    @apply inline-flex h-10 items-center  justify-center   border-magnum-800 bg-magnum-600  px-4 font-medium leading-none  disabled:opacity-50;
  }
</style>
