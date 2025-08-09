<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import {
    X,
    SquarePen,
    SmilePlus,
    Send,
    TriangleAlert,
    UserPlus,
    Quote,
    Bell,
    RefreshCw,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import {
    getMetadataList,
    promisePublishSignedEvent,
    type MetadataList,
    type UserData,
  } from "$lib/func/nostr";
  import {
    emojis,
    nowProgress,
    uploader,
    postWindowOpen,
    additionalPostOptions,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { contentCheck } from "$lib/func/contentCheck";

  import UploaderSelect from "./Elements/UploaderSelect.svelte";
  import MediaPicker from "./Elements/MediaPicker.svelte";
  import { filesUpload, delay, displayShortPub } from "$lib/func/util";

  import type { DefaultPostOptions, MargePostOptions } from "$lib/types";

  import { nip07Signer, type EventPacket } from "rx-nostr";
  import { writable, type Writable } from "svelte/store";

  import type { QueryKey } from "@tanstack/svelte-query";
  import { nsecRegex } from "$lib/func/regex";
  import { clientTag } from "$lib/func/constants";

  import { convertMetaTags } from "$lib/func/imeta";
  import { loginUser, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserName from "./NostrElements/user/UserName.svelte";

  import AlertDialog from "./Elements/AlertDialog.svelte";
  import CustomEmoji from "./NostrElements/content/CustomEmoji.svelte";
  import PostPreview from "./PostPreview.svelte";
  import EmojiListUpdate from "./SettingsElements/EmojiListUpdate.svelte";
  import GeohashMap from "./GeohashMap.svelte";
  import { untrack } from "svelte";
  import MakePollUI from "./MakePollUI.svelte";
  import { TokenType, type Token } from "@konemono/nostr-content-parser";

  // ----------------------------------------
  // Component Props
  // ----------------------------------------
  interface Props {
    options?: DefaultPostOptions;
    propSignPubkey?: string | undefined;
    visible?: boolean;
  }

  let {
    options = {
      tags: [],
      kind: 1,
      content: "",
    },
    propSignPubkey,
    visible = true,
  }: Props = $props();

  // ----------------------------------------
  // Constants
  // ----------------------------------------
  const zIndex = 50;
  const bulkReplyThreshold = 30;

  // ----------------------------------------
  // Dialog Setup
  // ----------------------------------------
  const { elements, states } = createDialog({
    forceVisible: true,
    closeOnOutsideClick: false,
    escapeBehavior: "ignore",
  });

  const { trigger, overlay, content, close, portalled } = elements;
  const { open } = states;

  // ----------------------------------------
  // State Management
  // ----------------------------------------
  let geohash: string = $state("");
  let text: string = $state(options.content ?? "");
  let tags: string[][] = $state([...options.tags]);
  // let cursorPosition: number = 0;
  let onWarning: boolean = $state<boolean>(false);
  let warningText = $state("");
  let customReaction: string = $state("");
  let viewCustomEmojis: boolean = $state<boolean>(false);
  let viewMetadataList: boolean = $state(false);
  let inputMetadata: string = $state("");
  let metadata: Nostr.Event | undefined = $state(undefined);
  let additionalReplyUsers: string[] = $state([]);
  let clickEscape: number = $state(0);
  let signPubkey: string | undefined = $state();
  let isPosting: boolean = $state(false);
  let nsecCheck = $derived(nsecRegex.test(text) || nsecRegex.test(warningText));
  let initOptions: MargePostOptions = $state({
    ...options,
    kind: options.kind ?? 1,
  });

  // DOM references
  let textarea: HTMLTextAreaElement | undefined = $state();
  let warningTextarea: HTMLInputElement | undefined = $state();
  let emojiInput: HTMLInputElement | undefined = $state();
  let metadataInput: HTMLInputElement | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();

  // File handling
  let files: FileList | undefined = $state();
  let uploadAbortController: AbortController | null = $state(null);

  // Event preparation
  let newev: Nostr.EventParameters | undefined;

  // Derived data
  let metadataList: MetadataList = $derived.by(() => {
    if (!viewMetadataList) return {};

    try {
      const metadataStr = localStorage.getItem("metadata");
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

  // Dialog handlers
  // svelte-ignore non_reactive_update
  let openConfirm: (bool: boolean) => void = () => {};
  // svelte-ignore non_reactive_update
  let openHellConfirm: (bool: boolean) => void;

  $effect(() => {
    if (geohash) {
      untrack(() => {
        // まず現在の g タグをフィルタリングで除去
        const filteredTags = tags.filter((tag) => tag[0] !== "g");
        // 新しい g タグを追加
        tags = [...filteredTags, ["g", geohash]];
      });
    } else {
      untrack(() => {
        // geohash がない場合は g タグを除去
        tags = tags.filter((tag) => tag[0] !== "g");
      });
    }
  });
  // ----------------------------------------
  // User Authentication
  // ----------------------------------------
  async function getSignPubkey() {
    if (propSignPubkey) {
      signPubkey = propSignPubkey;
      return;
    }

    $nowProgress = true;

    try {
      if (!loginUser.get()) {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        if (pubkey) {
          loginUser.set(pubkey);
        }
      }

      if (loginUser.get()) {
        signPubkey = loginUser.get();
        metadata = (
          queryClient.getQueryData(["metadata", signPubkey]) as EventPacket
        )?.event;
      }
    } catch (error) {
      showToast("Error", "Failed to get sign pubkey", "bg-red-500");
    } finally {
      $nowProgress = false;
    }
  }

  // ----------------------------------------
  // Utility Functions
  // ----------------------------------------
  function showToast(title: string, description: string, color: string) {
    $toastSettings = { title, description, color };
  }

  function resetState() {
    text = options.content ?? "";
    tags = [...options.tags];
    warningText = "";
    onWarning = false;
    viewCustomEmojis = false;
    customReaction = "";
    additionalReplyUsers = [];
    initOptions = { ...options, kind: options.kind ?? 1 };
    viewMetadataList = false;
    inputMetadata = "";
    geohash = "";
  }

  // ----------------------------------------
  // Tag Management
  // ----------------------------------------
  function addEmojiTag(emoji: string[]) {
    // 1. URLが同じ絵文字を探す
    const sameEmoji = tags.find(
      (tag) => tag[0] === "emoji" && tag[2] === emoji[1] // URLが同じ
    );

    if (sameEmoji) {
      // 同じURLの絵文字があれば、その名前を使う
      emoji[0] = sameEmoji[1];
    }

    // 2. 同じ名前の絵文字があるか確認
    let sameNameEmoji = tags.find(
      (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
    );

    // 3. 絵文字の条件に従って追加処理
    if (sameNameEmoji) {
      // 名前が同じでURLが異なる場合、新しい名前を付けて追加
      if (sameNameEmoji[2] !== emoji[1]) {
        // 元の名前を保存
        const baseName = emoji[0];
        let num = 1;

        // 重複しない名前が見つかるまでnumをインクリメント
        emoji[0] = `${baseName}_${num}`;
        sameNameEmoji = tags.find(
          (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
        );

        while (sameNameEmoji) {
          num++;
          emoji[0] = `${baseName}_${num}`;
          sameNameEmoji = tags.find(
            (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
          );
        }

        tags.push(["emoji", ...emoji]);
      }
      // 完全に同じ名前・URLの絵文字がある場合は何もしない
    } else {
      // 同じ名前もURLもない場合、新しい絵文字として追加
      tags.push(["emoji", ...emoji]);
    }
  }

  function checkCustomEmojis(input: string) {
    const emojiMatches = input.match(/:[a-zA-Z0-9_]+:/g);

    if (!emojiMatches) return;

    emojiMatches.forEach((emoji) => {
      const emojiName = emoji.slice(1, -1);
      //tagsに既に同じ名前のタグがったらreturn
      if (tags.find((tag) => tag[0] === "emoji" && tag[1] === emojiName)) {
        return;
      }

      //なかったら絵文字リストにあるか探す
      const customEmoji = $emojis.list.find((e) => e[0] === emojiName);
      if (!customEmoji) return;

      //あったら入れる
      addEmojiTag(customEmoji);
    });
  }

  // ----------------------------------------
  // Event Publishing
  // ----------------------------------------
  async function postNote() {
    if (text.trim().length <= 0 || isPosting) return;
    //  checkCustomEmojis(text.trim());
    const { text: checkedText, tags: checkedTags } = contentCheck(
      text.trim(),
      tags
    );

    // Add warning tag if needed
    if (onWarning) {
      checkedTags.push(["content-warning", warningText]);
    }

    // Add additional reply users
    if (additionalReplyUsers.length > 0) {
      const replyUsersArray = additionalReplyUsers.map((user) => ["p", user]);
      checkedTags.push(...replyUsersArray);
    }

    // Add client tag if enabled in settings
    if (lumiSetting.get().addClientTag) {
      checkedTags.push(clientTag);
    }

    // Create event parameters
    newev = {
      kind: initOptions.kind,
      content: checkedText,
      tags: checkedTags,
    };

    // Check for bulk replies
    const pTagCount = checkedTags.filter((tag) => tag[0] === "p").length;
    if (pTagCount > bulkReplyThreshold) {
      openHellConfirm(true);
      return;
    }

    await sendEvent();
  }

  async function sendEvent() {
    if (!newev || isPosting) return;

    isPosting = true;
    $nowProgress = true;
    const signer = nip07Signer();

    try {
      const event = await signer.signEvent($state.snapshot(newev));
      const { event: ev, res } = await promisePublishSignedEvent(event);

      const successRelays = res
        .filter((item) => item.ok)
        .map((item) => item.from);

      // If no successful relays, try once more
      if (successRelays.length <= 0) {
        const { event: ev, res: res2 } = await promisePublishSignedEvent(event);

        const successRelays2 = res2
          .filter((item) => item.ok)
          .map((item) => item.from);

        if (successRelays2.length <= 0) {
          showToast("Failed", "Failed to publish", "bg-red-500");
        } else {
          $open = false;
        }
      } else {
        $open = false;
      }
    } catch (error) {
      console.log(error);
      showToast("Failed", "Failed to publish", "bg-red-500");
    } finally {
      $nowProgress = false;
      isPosting = false;
      newev = undefined;
    }
  }

  // ----------------------------------------
  // Text Handling
  // ----------------------------------------
  // function handleTextareaInput(event: Event) {
  //   const target = event.target as HTMLTextAreaElement;
  //   cursorPosition = target.selectionStart;
  // }

  function insertTextAtCursor(
    insertText: string,
    options: {
      addSpaceBefore?: boolean;
      addSpaceAfter?: boolean;
    } = {}
  ) {
    const { addSpaceBefore = false, addSpaceAfter = false } = options;

    // 空白文字を判定する正規表現
    const WHITESPACE_REGEX = /^\s+$/;

    // 文脈に応じたスペース追加
    const finalInsertText = (() => {
      let result = insertText;

      // 文頭の特別な処理
      const isTextStart = textarea?.selectionStart === 0;

      // 前のスペース処理
      if (addSpaceBefore) {
        // 文頭でない、かつ前の文字が空白でない場合
        if ((!isTextStart && textarea?.selectionStart) || 0 > 0) {
          const prev = text[textarea?.selectionStart || 0 - 1];
          if (!WHITESPACE_REGEX.test(prev)) {
            result = ` ${result}`;
          }
        }
      }

      // 後ろのスペース処理
      if (addSpaceAfter) {
        const next = text[textarea?.selectionStart || 0];
        if (!WHITESPACE_REGEX.test(next)) {
          result = `${result} `;
        }
      }

      return result;
    })();

    // テキストと カーソル位置の更新
    const insertStart = textarea?.selectionStart || 0;
    const insertEnd = insertStart + finalInsertText.length;
    text =
      text.slice(0, insertStart) + finalInsertText + text.slice(insertStart);

    // カーソル位置を挿入テキストの最後に調整

    setTimeout(() => {
      textarea?.focus();
      textarea?.setSelectionRange(insertEnd, insertEnd);
    }, 0);
  }

  function handleClickEmoji(e: string[]) {
    const emoji = [...e];
    addEmojiTag(emoji);

    const emojiText = `:${emoji[0]}:`;
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
      //$nowProgress = false;
      return;
    }

    // Cancel existing upload if any
    if (uploadAbortController) {
      uploadAbortController.abort();
    }

    // Create new abort controller
    uploadAbortController = new AbortController();

    try {
      const uploadedURPs = await filesUpload(
        fileList,
        $uploader,
        uploadAbortController.signal
      );

      // Process each uploaded file
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

        // Add metadata tags if available
        if (data.nip94_event) {
          tags.push(convertMetaTags(data.nip94_event));
        }

        // Insert URL at cursor position
        insertTextAtCursor(url, {
          addSpaceBefore: true,
          addSpaceAfter: true,
        });

        // Wait to ensure text insertion completes
        await delay(10);
      });

      await Promise.all(promises);
    } catch (error) {
      console.log(error);
    } finally {
      //  $nowProgress = false;
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

    // Handle image files in clipboard
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

    /*  // Check for custom emojis in pasted text
    const pastedText = event.clipboardData.getData("text");
    if (pastedText) {
      checkCustomEmojis(pastedText);
    } */
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
  function handleOverlayClick(event: MouseEvent) {
    if (text.trim().length > 0) {
      openConfirm?.(true);
    } else {
      $open = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Submit on Ctrl+Enter
    if (event.ctrlKey && event.key === "Enter") {
      postNote();
      return;
    }

    // Update cursor position on arrow keys
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      // setTimeout(() => {
      //   if (textarea) {
      //     cursorPosition = textarea.selectionStart;
      //   }
      // }, 0);
    }
  }

  function keyboardShortcut(event: KeyboardEvent) {
    event.preventDefault();
    const activeElement = document.activeElement;

    // Handle Escape key
    if ($open === true && event.key === "Escape") {
      clickEscape++;
      if (clickEscape >= 2) {
        clickEscape = 0;
        $open = false;
      }
      return;
    }

    // Open post window with 'n' key when appropriate
    if (
      event.key === "n" &&
      $open === false &&
      !(activeElement instanceof HTMLInputElement) &&
      !(activeElement instanceof HTMLTextAreaElement)
    ) {
      $open = true;
    }
  }

  function handleClickCustomReaction() {
    viewCustomEmojis = !viewCustomEmojis;

    if (viewCustomEmojis) {
      setTimeout(() => {
        emojiInput?.focus();
        emojiInput?.setSelectionRange(0, 0);
      });
    }

    if (viewMetadataList && viewCustomEmojis) {
      viewMetadataList = false;
    }
  }

  function handleClickMetadata() {
    viewMetadataList = !viewMetadataList;

    if (viewMetadataList) {
      setTimeout(() => {
        metadataInput?.focus();
        metadataInput?.setSelectionRange(0, 0);
      });
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

  // ----------------------------------------
  // Subscription Handlers
  // ----------------------------------------
  postWindowOpen.subscribe((value) => {
    if (!value) return;

    const addOption = $state.snapshot($additionalPostOptions);

    if (addOption) {
      // Handle tags, removing duplicate root tags if needed
      initOptions = {
        ...options,
        kind: addOption.kind ?? options.kind ?? 1,
        tags: (() => {
          const combinedTags = options.tags.concat(addOption.tags);
          let hasRoot = false;

          return combinedTags.filter((tag) => {
            if (tag.includes("root")) {
              if (!hasRoot) {
                hasRoot = true;
                return true;
              }
              return false;
            }
            return true;
          });
        })(),
        content: (options.content ?? "") + addOption.content,
        addableUserList: addOption.addableUserList,
        defaultUsers: addOption.defaultUsers,
        warningText: addOption.warningText,
      };

      tags = initOptions.tags;
      text = initOptions.content ?? "";

      // Set additional reply users if provided
      if (initOptions.addableUserList) {
        additionalReplyUsers = [...initOptions.addableUserList];
      }

      // Set warning if provided
      if (initOptions.warningText !== undefined) {
        warningText = initOptions.warningText;
        onWarning = true;
      }

      // Clear additional options after processing
      setTimeout(() => {
        $additionalPostOptions = undefined;
      }, 0);
    }

    $open = true;
    $postWindowOpen = false;
  });

  open.subscribe((value) => {
    if (value) {
      // Get sign pubkey on window open
      getSignPubkey();
      clickEscape = 0;

      // Focus textarea after rendering
      setTimeout(() => {
        if (textarea) {
          textarea.selectionEnd = 0;
          textarea.scroll({ top: 0 });
          textarea.focus();
        }
      }, 0);
    } else {
      // Cancel uploads and reset state when closing
      if (uploadAbortController) {
        uploadAbortController.abort();
      }
      resetState();
    }
  });

  selectedUploader.subscribe((value) => {
    if (value) {
      $uploader = value;
    }
  });

  const onPolled = (id: string) => {
    insertTextAtCursor(`nostr:${id}`, {
      addSpaceBefore: true,
      addSpaceAfter: true,
    });
  };
</script>

<svelte:window onkeyup={keyboardShortcut} onkeydown={handleKeyDown} />
{#if visible}
  <button
    title="Open post window (N)"
    use:melt={$trigger}
    class="inline-flex items-center justify-center rounded-full bg-neutral-900 border border-magnum-300 p-3.5
  font-medium leading-none text-magnum-300 shadow hover:opacity-75 z-30"
  >
    <SquarePen size={28} />
  </button>
{/if}
{#if $open}
  <div use:melt={$portalled} class="fixed top-0 left-0 z-50">
    <button
      aria-label="overlay"
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
      onclick={handleOverlayClick}
    ></button>
    <div
      class="fixed left-1/2 top-[40%] z-50 max-h-[85vh] w-[640px]
            max-w-[95vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
      use:melt={$content}
    >
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
        replyUsers={[
          ...(initOptions.defaultUsers || []),
          ...additionalReplyUsers,
        ]}
        {addUser}
      />

      <div class="relative rounded-md bg-neutral-900 p-6 shadow-lg">
        <button
          use:melt={$close}
          aria-label="close"
          title="Close (Esc)"
          class="absolute right-0 top-1 inline-flex h-7 w-7 appearance-none
                items-center justify-center rounded-full text-magnum-800 bg-magnum-100
                hover:bg-magnum-100/75 active:shadow-magnum-400"
        >
          <X size={32} />
        </button>

        <div class="flex flex-row gap-1 md:gap-2 mb-1">
          <button
            onclick={async () => {
              onWarning = !onWarning;
              if (onWarning) {
                await delay(10);
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
            <Quote size="20" class="stroke-magnum-300 " /><!-- N-->
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
                <!-- <Bell class="size-4 text-magnum-500 fill-magnum-500" /> --><UserName
                  pubhex={user}
                />
              </div>
            {/each}
          {/if}

          {#if initOptions.addableUserList}
            <div class="flex flex-wrap gap-1">
              {#each initOptions.addableUserList as replyUser, index}
                {#if additionalReplyUsers.includes(replyUser)}
                  <!-- Active reply user (selected) -->
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
                  <!-- Inactive reply user (not selected) -->
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
            oninput={(e) => {
              //  handleTextareaInput(e);
              clickEscape = 0;
              checkCustomEmojis(text);
            }}
            onclick={(e) => {
              //  handleTextareaInput(e);
              clickEscape = 0;
            }}
            ontouchend={(e) => {
              //   handleTextareaInput(e);
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
        <!-- <div class="text-sm">
          {$_("post.quote")}
        </div> -->

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
                class={viewCustomEmojis
                  ? "stroke-magnum-500"
                  : "stroke-magnum-300"}
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
                class={viewMetadataList
                  ? "stroke-magnum-500"
                  : "stroke-magnum-300"}
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
    </div>
  </div>
{/if}

<AlertDialog
  okButtonName="Yes, close"
  bind:openDialog={openConfirm}
  closeOnOutsideClick={true}
  onClickOK={() => {
    open.set(false);
    openConfirm?.(false);
  }}
  title="Confirm close"
>
  {#snippet main()}{$_("post.confirm")}
  {/snippet}
</AlertDialog>

<AlertDialog
  okButtonName="Yes, send"
  bind:openDialog={openHellConfirm}
  closeOnOutsideClick={true}
  onClickOK={async () => {
    //いっぱいPでもおくってOK
    await sendEvent();
    openHellConfirm?.(false);
  }}
  title="Confirm Reply to Many People"
>
  {#snippet main()}{$_("post.hell")}
  {/snippet}
</AlertDialog>

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
