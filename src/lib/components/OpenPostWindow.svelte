<script lang="ts">
  import { _ } from "svelte-i18n";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import {
    X,
    SquarePen,
    SmilePlus,
    Send,
    TriangleAlert,
    Plus,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { publishEvent } from "$lib/func/nostr";
  import {
    emojis,
    nowProgress,
    showImg,
    showPreview,
    uploader,
    postWindowOpen,
    additionalPostOptions,
    queryClient,
    loginUser,
    toastSettings,
  } from "$lib/stores/stores";
  import { contentCheck } from "$lib/func/contentCheck";
  import Content from "./NostrElements/Note/Content.svelte";
  import UploaderSelect from "./Elements/UploaderSelect.svelte";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";
  import MediaPicker from "./Elements/MediaPicker.svelte";
  import { convertMetaTags, filesUpload } from "$lib/func/util";
  import type { FileUploadResponse } from "nostr-tools/nip96";
  import type {
    DefaultPostOptions,
    AdditionalPostOptions,
    MargePostOptions,
    Profile,
  } from "$lib/types";
  import EventCard from "./NostrElements/Note/EventCard.svelte";
  import { now, type EventPacket } from "rx-nostr";
  import { writable, type Writable } from "svelte/store";
  import Metadata from "./NostrMainData/Metadata.svelte";
  //チャンネルの情報をあらかじめ入れておく。とかと別でリプライユーザーとかをいれる必要があるから、リプとかのときのオプションと別にする

  export let options: DefaultPostOptions = {
    tags: [],
    kind: 1,
    content: "",
  };

  let text: string = options.content ?? "";
  let tags: string[][] = [...options.tags];
  let cursorPosition: number = 0;
  let onWarning: boolean;
  let warningText = "";
  let customReaction: string = "";
  let viewCustomEmojis: boolean;
  let selectedUploader: string;
  let files: FileList | undefined;
  let fileInput: HTMLInputElement | undefined;
  let initOptions: MargePostOptions = { ...options };
  const { elements, states } = createDialog({
    forceVisible: true,
    closeOnOutsideClick: false, //overlay押したときに閉じない

    escapeBehavior: "ignore",
  });
  const { trigger, overlay, content, close, portalled } = elements;
  const { open } = states;

  //$: console.log(initOptions.tags);
  let metadata: Nostr.Event | undefined = undefined;

  let additionalReplyUsers: Writable<string[]> = writable([]);

  $: if ($postWindowOpen) {
    console.log($additionalPostOptions);
    if ($additionalPostOptions) {
      initOptions = {
        ...options,
        tags: [...options.tags, ...$additionalPostOptions.tags], // タグをコピー
        content: (options.content ?? "") + $additionalPostOptions.content, // contentをマージ
        addableUserList: $additionalPostOptions.addableUserList,
        defaultUsers: $additionalPostOptions.defaultUsers,
        warningText: $additionalPostOptions.warningText,
      };
      tags = initOptions.tags;
      text = initOptions.content ?? "";

      if (initOptions.addableUserList) {
        $additionalReplyUsers = [...initOptions.addableUserList];
      }
      if (initOptions.warningText !== undefined) {
        warningText = initOptions.warningText;
        onWarning = true;
      }
      $additionalPostOptions = undefined;
    }

    $open = true;
    $postWindowOpen = false;
  }
  let signPubkey: string;
  $: if ($open) {
    //毎回ユーザー切り替えてないとも限らないから毎回チェックしようとしてみる
    signPubkeyCheck();

    // const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
    // metadata = $queryClient.getQueryData(["metadata", pubkey]);
    // console.log(metadata);

    if (textarea) {
      textarea.focus();
      textareaFocus = true;
      textarea.selectionEnd = 0;
      textarea.scroll({
        top: 0,
      });
    }
  }
  async function signPubkeyCheck() {
    try {
      const pub = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
      if (pub) {
        console.log(pub);
        signPubkey = pub;

        metadata = (
          $queryClient.getQueryData(["metadata", signPubkey]) as EventPacket
        )?.event;
      }
    } catch (error) {
      $toastSettings = {
        title: "Error",
        description: "failed to get sign pubkey",
        color: "bg-red-500",
      };
      return;
    }
  }
  $: if (!$open) {
    resetState();
  }

  const metadataName = (ev: Nostr.Event): string => {
    try {
      const profile: Profile = JSON.parse(ev.content);
      if (profile.name) {
        return profile.name;
      } else {
        return "";
      }
    } catch (error) {
      return "";
    }
  };

  const postNote = async () => {
    if (text.trim().length > 0) {
      const { text: checkedText, tags: checkedTags } = contentCheck(
        text.trim(),
        tags
      );
      if (onWarning) checkedTags.push(["content-warning", warningText]);
      if ($additionalReplyUsers.length > 0) {
        const replyUsersArray: string[][] = $additionalReplyUsers.map(
          (user) => ["p", user]
        );
        checkedTags.push(...replyUsersArray);
      }
      const newev: Nostr.EventParameters = {
        kind: options.kind ?? 1,
        content: checkedText,
        tags: checkedTags,
      };

      publishEvent(newev);
      $open = false;
    }
  };

  const resetState = () => {
    text = options.content ?? "";
    tags = [...options.tags];
    warningText = "";
    onWarning = false;
    viewCustomEmojis = false;
    customReaction = "";
    $additionalReplyUsers = [];
    initOptions = { ...options };
  };

  const handleTextareaInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    cursorPosition = target.selectionStart;
  };

  const handleClickEmoji = (e: string[]) => {
    const emojiTag: string[] = ["emoji", ...e];
    if (!tags.some((tag) => tag[0] === "emoji" && tag[1] === e[0])) {
      tags.push(emojiTag);
    }
    const emojiText = `:${e[0]}:`;
    text =
      text.slice(0, cursorPosition) + emojiText + text.slice(cursorPosition);
    cursorPosition += emojiText.length;
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length <= 0 || !$uploader) return;
    $nowProgress = true;
    const uploadedURPs: FileUploadResponse[] = await filesUpload(
      fileList,
      $uploader
    );
    console.log(uploadedURPs);
    uploadedURPs.forEach((data) => {
      if (data.status === "success") {
        const url = data.nip94_event?.tags.find((tag) => tag[0] === "url")?.[1];

        if (url) {
          const len = text.length; //ULR入れる前のカーソルの場所にカーソルおく
          const urln = `\n${url}`;
          text =
            text.slice(0, cursorPosition) + urln + text.slice(cursorPosition);
          cursorPosition = len;

          //imetaをたぐにいれる
          if (data.nip94_event) {
            tags.push(convertMetaTags(data.nip94_event));
          }
          setTimeout(() => {
            textarea.selectionEnd = cursorPosition;
            textarea.focus();
          }, 10);
        }
      }
    });
    $nowProgress = false;
  };
  // ドラッグ&ドロップのイベントハンドラ
  const handleDrop = async (event: DragEvent) => {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      await handleFileUpload(event.dataTransfer.files);
    }
  };
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };
  const onChangeHandler = async (e: Event): Promise<void> => {
    const _files = (e.target as HTMLInputElement).files;
    if (_files) {
      await handleFileUpload(_files);
    }
  };

  const paste = async (event: ClipboardEvent) => {
    console.log("[paste]", event.type, event.clipboardData);
    if (!event.clipboardData) return;

    const files = [...event.clipboardData.items]
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    const fileList = new DataTransfer();
    files.forEach((file) => fileList.items.add(file));
    await handleFileUpload(fileList.files);
  };

  $: if (selectedUploader) {
    $uploader = selectedUploader;
  }

  let textarea: HTMLTextAreaElement;

  //Close確認用
  const {
    elements: {
      trigger: triggerConfirm,
      overlay: overlayConfirm,
      content: contentConfirm,
      title: titleConfirm,
      description: descriptionConfirm,
      close: closeConfirm,
      portalled: portalledConfirm,
    },
    states: { open: openConfirm },
  } = createDialog({
    forceVisible: true,
    closeOnOutsideClick: false,
  }); //overlay押したときに閉じない});

  // オーバーレイクリック時の処理を追加
  const handleOverlayClick = (event: MouseEvent) => {
    if (text.trim().length > 0) {
      // テキストエリアに入力がある場合、アラートを表示
      $openConfirm = true;
    } else {
      // テキストエリアが空の場合、ダイアログを閉じる
      $open = false;
    }
  };

  // キーボードショートカットの処理
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === "Enter") {
      postNote();
    }
  };

  let textareaFocus = false;
  const keyboardShortcut = (event: KeyboardEvent) => {
    event.preventDefault();
    const activeElement = document.activeElement;
    if ($open === true && event.key === "Escape") {
      if (textareaFocus) {
        textareaFocus = false;
      } else {
        $open = false;
      }
    }

    if (
      event.key === "n" &&
      $open === false &&
      !(activeElement instanceof HTMLInputElement) &&
      !(activeElement instanceof HTMLTextAreaElement)
    ) {
      $open = true;
      return;
    }
  };
</script>

<svelte:window on:keyup={keyboardShortcut} on:keydown={handleKeyDown} />
<button
  use:melt={$trigger}
  class="inline-flex items-center justify-center rounded-full bg-white border border-magnum-700 p-3.5
  font-medium leading-none text-magnum-700 shadow hover:opacity-75"
>
  <SquarePen size={28} />
</button>

{#if $open}
  <div use:melt={$portalled}>
    <button
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
      on:click={handleOverlayClick}
    />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[720px]
            max-w-[90vw] -translate-x-1/2 -translate-y-1/2"
      use:melt={$content}
    >
      {#if signPubkey && (initOptions.tags.length > 0 || (initOptions.content && initOptions.content.length > 0) || ($showImg && $showPreview))}
        <div
          class="rounded-md bg-neutral-900
            p-6 pt-3 shadow-lg mb-4"
        >
          <div class="font-medium text-magnum-400">preview</div>
          <EventCard
            {metadata}
            note={{
              sig: "",
              id: "",
              pubkey: signPubkey,
              content: text,
              tags: tags,
              kind: options.kind ?? 1,
              created_at: now(),
            }}
            displayMenu={false}
          />
          <!-- <div
            class="rounded-md border-magnum-500 border min-h-8 max-h-28 overflow-y-auto resize-y"
          >
            <Content bind:text bind:tags />
          </div> -->
        </div>
      {/if}
      <div class="relative rounded-md bg-neutral-900 p-6 shadow-lg">
        <button
          use:melt={$close}
          aria-label="close"
          class="absolute right-0 top-1 inline-flex h-7 w-7 appearance-none
                items-center justify-center rounded-full text-magnum-800 bg-magnum-100
                hover:bg-magnum-100/75 active:shadow-magnum-400"
        >
          <X size={32} />
        </button>
        <div class="flex flex-row gap-2 mb-2">
          <MediaPicker bind:files bind:fileInput on:change={onChangeHandler} />

          <UploaderSelect bind:defaultValue={$uploader} bind:selectedUploader />
        </div>
        <div class="flex gap-1 mb-0.5">
          {#if initOptions.defaultUsers && initOptions.defaultUsers.length > 0}
            <div class=" rounded-md bg-magnum-300 text-magnum-950 w-fit px-1">
              @<Metadata
                queryKey={["metadata", initOptions.defaultUsers[0]]}
                pubkey={initOptions.defaultUsers[0]}
                let:metadata
              >
                {metadataName(metadata)}
              </Metadata>
            </div>
          {/if}
          {#if initOptions.addableUserList}
            {#each initOptions.addableUserList as replyuser, index}
              <div
                class=" rounded-md {$additionalReplyUsers.includes(replyuser)
                  ? 'bg-magnum-300'
                  : 'bg-magnum-300/50'} text-magnum-950 w-fit px-1"
              >
                @<Metadata
                  queryKey={["metadata", replyuser]}
                  pubkey={replyuser}
                  let:metadata
                >
                  {metadataName(metadata)}
                </Metadata>
                {#if $additionalReplyUsers.includes(replyuser)}
                  <button
                    class=" inline-flex h-6 w-6 appearance-none align-middle
                     rounded-full p-1 text-magnum-800 bg-magnum-100
                    hover:bg-magnum-300 focus:shadow-magnum-400"
                    on:click={() => {
                      $additionalReplyUsers = $additionalReplyUsers.filter(
                        (user) => user !== replyuser
                      );
                    }}
                  >
                    <X class="size-4" />
                  </button>
                {:else}<button
                    class=" inline-flex h-6 w-6 appearance-none align-middle
                 rounded-full p-1 text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
                    on:click={() => {
                      additionalReplyUsers.update((users) => {
                        users.push(replyuser);
                        return users;
                      });
                    }}
                  >
                    <Plus class="size-4" />
                  </button>{/if}
              </div>
            {/each}
          {/if}
        </div>
        <fieldset class="mb-1 flex items-center gap-5">
          <textarea
            class="inline-flex h-24 w-full flex-1 items-center justify-center
                    rounded-sm border border-solid p-2 leading-none bg-neutral-800"
            id="note"
            bind:this={textarea}
            bind:value={text}
            on:focus={() => {
              textareaFocus = true;
            }}
            on:input={handleTextareaInput}
            on:click={handleTextareaInput}
            on:touchend={handleTextareaInput}
            on:paste={paste}
            on:drop={handleDrop}
            on:dragover={handleDragOver}
            placeholder="いま どうしてる？"
          />
        </fieldset>
        {#if onWarning}
          <div class="flex">
            <div class="mt-auto mb-auto text-sm break-keep">理由：</div>
            <input
              type="text"
              class="px-1 h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
              bind:value={warningText}
            />
          </div>
        {:else}<div class="h-4" />{/if}

        <div class="mt-2 flex justify-between">
          <button
            on:click={() => {
              onWarning = !onWarning;
            }}
            class=" h-8 rounded-sm
                bg-zinc-100 px-4 font-medium leading-none text-zinc-600 hover:opacity-75"
          >
            <TriangleAlert
              size="20"
              class="stroke-magnum-500 {onWarning ? 'fill-magnum-700 ' : ''}"
            />
          </button>

          <div class=" flex gap-4">
            {#if $emojis && $emojis.length > 0}
              {#if viewCustomEmojis}
                <input
                  type="text"
                  class="h-8 w-full rounded-md text-magnum-100 border-2
           'border-neutral-900'}"
                  bind:value={customReaction}
                />
              {/if}
              <button
                on:click={() => {
                  viewCustomEmojis = !viewCustomEmojis;
                }}
                class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600 hover:opacity-75 active:opacity-50"
              >
                <SmilePlus
                  size="20"
                  class={viewCustomEmojis
                    ? "fill-magnum-700 stroke-magnum-500"
                    : ""}
                />
              </button>
            {/if}

            <button
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900 hover:opacity-75 active:opacity-50"
              on:click={postNote}
            >
              <Send size="20" />
            </button>
          </div>
        </div>

        {#if viewCustomEmojis}
          <div
            class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
          >
            {#each $emojis as e, index}
              {#if customReaction === "" || e[0]
                  .toLowerCase()
                  .includes(customReaction.toLowerCase())}
                <button
                  on:click={() => handleClickEmoji(e)}
                  class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
                >
                  {#if $showImg}
                    <img
                      loading="lazy"
                      class="h-4 object-contain justify-self-center"
                      src={e[1]}
                      alt={e[0]}
                      title={e[0]}
                    />{:else}{e[0]}{/if}
                </button>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if $openConfirm}
  <div use:melt={$portalledConfirm}>
    <div use:melt={$overlayConfirm} class="fixed inset-0 z-50 bg-black/50" />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] -translate-x-1/2 -translate-y-1/2 bg-neutral-900 p-2"
      use:melt={$contentConfirm}
    >
      <h2
        use:melt={$titleConfirm}
        class="m-0 text-lg font-medium text-magnum-400"
      >
        Confirm close
      </h2>
      <p use:melt={$descriptionConfirm} class="mb-5 mt-2 leading-normal">
        {$_("post.confirm")}
      </p>

      <div class="mt-6 flex justify-end gap-4">
        <button
          class="inline-flex h-8 items-center justify-center rounded-[4px] px-4 font-medium leading-none bg-zinc-100 text-zinc-600 hover:opacity-75"
          use:melt={$closeConfirm}
        >
          Cancel
        </button>
        <button
          class="inline-flex h-8 items-center justify-center rounded-[4px]
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900 hover:opacity-75"
          on:click={() => {
            open.set(false);
            openConfirm.set(false);
          }}
        >
          Yes, close
        </button>
      </div>
    </div>
  </div>
{/if}
