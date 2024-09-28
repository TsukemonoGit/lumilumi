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
    UserPlus,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import {
    getDefaultWriteRelays,
    getMetadataList,
    promisePublishEvent,
    promisePublishSignedEvent,
    publishEvent,
    type MetadataList,
    type UserData,
  } from "$lib/func/nostr";
  import {
    emojis,
    nowProgress,
    showImg,
    showPreview,
    uploader,
    postWindowOpen,
    additionalPostOptions,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { contentCheck } from "$lib/func/contentCheck";

  import UploaderSelect from "./Elements/UploaderSelect.svelte";

  import MediaPicker from "./Elements/MediaPicker.svelte";
  import { convertMetaTags, filesUpload, nsecRegex } from "$lib/func/util";
  import type { FileUploadResponse } from "nostr-tools/nip96";
  import type {
    DefaultPostOptions,
    MargePostOptions,
    Profile,
  } from "$lib/types";
  import EventCard from "./NostrElements/Note/EventCard.svelte";
  import { nip07Signer, now, type EventPacket } from "rx-nostr";
  import { writable, type Writable } from "svelte/store";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { nip19 } from "nostr-tools";
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
  let initOptions: MargePostOptions = { ...options, kind: options.kind ?? 1 };
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
  let clickEscape: number = 0;

  $: if ($postWindowOpen) {
    console.log($additionalPostOptions);

    if ($additionalPostOptions) {
      // タグをコピー

      initOptions = {
        ...options,
        kind: $additionalPostOptions.kind ?? options.kind ?? 1,
        //チャンネルからリプするときに optionsとadditional両方にrootがついてしまうので、ルートタグの重複をチェック
        tags: (() => {
          const combinedTags = options.tags.concat($additionalPostOptions.tags);
          let hasRoot = false;

          return combinedTags.filter((tag) => {
            // "root"タグを含む場合の処理
            if (tag.includes("root")) {
              if (!hasRoot) {
                hasRoot = true; // 最初の"root"タグは保持
                return true;
              }
              return false; // 2つ目以降の"root"タグは除外
            }
            return true; // root以外のタグはそのまま
          });
        })(),
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
  $: if ($open === true) {
    //毎回ユーザー切り替えてないとも限らないから毎回チェックしようとしてみる
    signPubkeyCheck();
    clickEscape = 0;
    // const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
    // metadata = $queryClient.getQueryData(["metadata", pubkey]);
    // console.log(metadata);

    if (textarea) {
      textarea.focus();

      textarea.selectionEnd = 0;
      textarea.scroll({
        top: 0,
      });
    }
  }
  async function signPubkeyCheck() {
    if ($nowProgress) {
      return;
    }
    $nowProgress = true;
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
    }
    $nowProgress = false;
  }

  // アップロードキャンセル用のコントローラーを作成
  let uploadAbortController: AbortController | null = null;

  $: if (!$open) {
    if (uploadAbortController) {
      uploadAbortController.abort(); // アップロードを中断
    }
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
  let isPosting: boolean = false;
  $: nsecCheck = nsecRegex.test(text) || nsecRegex.test(warningText);
  const postNote = async () => {
    isPosting = true;
    $nowProgress = true;
    if (text.trim().length <= 0) return;

    const { text: checkedText, tags: checkedTags } = contentCheck(
      text.trim(),
      tags
    );
    if (onWarning) checkedTags.push(["content-warning", warningText]);
    if ($additionalReplyUsers.length > 0) {
      const replyUsersArray: string[][] = $additionalReplyUsers.map((user) => [
        "p",
        user,
      ]);
      checkedTags.push(...replyUsersArray);
    }
    const newev: Nostr.EventParameters = {
      kind: initOptions.kind,
      content: checkedText,
      tags: checkedTags,
    };
    const signer = nip07Signer();
    const event = await signer.signEvent(newev);
    //publishEvent(newev);

    const { event: ev, res } = await promisePublishSignedEvent(event);
    console.log(res);

    const isSuccessRelays: string[] = res
      .filter((item) => item.ok)
      .map((item) => normalizeRelayURL(item.from));
    const isFailedRelays = res
      .filter((item) => !item.ok)
      .map((item) => normalizeRelayURL(item.from));

    // let str = generateResultMessage(isSuccessRelays, isFailedRelays);

    const writeRelays = getDefaultWriteRelays();

    const pendingRelays = writeRelays.filter(
      (relay) =>
        !isSuccessRelays.includes(relay) && !isFailedRelays.includes(relay)
    );
    console.log(pendingRelays);
    // if (pendingRelays.length > 0) {
    //   str = str + `\nPending\n${pendingRelays.join("\n")}`;
    // }
    // $toastSettings = {
    //   title: isSuccessRelays.length > 0 ? "Success" : "Failed",
    //   description: str,
    //   color: isSuccessRelays.length > 0 ? "bg-green-500" : "bg-red-500",
    // };
    if (isSuccessRelays.length <= 0) {
      //再送チャレンジ
      const { event: ev, res: res2 } = await promisePublishSignedEvent(event);

      const isSuccessRelays2: string[] = res2
        .filter((item) => item.ok)
        .map((item) => normalizeRelayURL(item.from));
      if (isSuccessRelays2.length <= 0) {
        $toastSettings = {
          title: "Failed",
          description: "failed to publish",
          color: "bg-red-500",
        };
      }
    } else {
      //成功したときだけ閉じる
      $open = false;
    }
    $nowProgress = false;
    isPosting = false;
  };

  //末尾に"/"をつける
  const normalizeRelayURL = (str: string) => {
    return !str.trim().endsWith("/") ? `${str.trim()}/` : str.trim();
  };
  const resetState = () => {
    text = options.content ?? "";
    tags = [...options.tags];
    warningText = "";
    onWarning = false;
    viewCustomEmojis = false;
    customReaction = "";
    $additionalReplyUsers = [];
    initOptions = { ...options, kind: options.kind ?? 1 };
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
    //viewCustomEmojis = false;
    textarea.focus();
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length <= 0 || !$uploader) return;
    $nowProgress = true;

    // 既存のアップロードがある場合はキャンセルする
    if (uploadAbortController) {
      uploadAbortController.abort();
    }

    // 新しいアップロード用のAbortControllerを作成
    uploadAbortController = new AbortController();

    try {
      const uploadedURPs: FileUploadResponse[] = await filesUpload(
        fileList,
        $uploader,
        uploadAbortController.signal // アップロード中断のシグナルを渡す
      );

      console.log(uploadedURPs);

      // 非同期処理を待つPromise配列
      const promises = uploadedURPs.map(async (data) => {
        if (data.status === "success") {
          const url = data.nip94_event?.tags.find(
            (tag) => tag[0] === "url"
          )?.[1];

          if (url) {
            const len = text.length; // ULR入れる前のカーソルの場所にカーソルおく
            const urln = `\n${url}`;

            // imetaをタグに入れる
            if (data.nip94_event) {
              tags.push(convertMetaTags(data.nip94_event));
            }

            // 500ms待機するPromise //image not foundになるのを避けるため
            await delay(1000);
            text =
              text.slice(0, cursorPosition) + urln + text.slice(cursorPosition);
            cursorPosition = len;

            // さらに10ms待機するPromise //確実にテキスト挿入完了してから次の処理をするため
            await delay(10);

            textarea.selectionEnd = cursorPosition;
            textarea.focus();
          }
        }
      });

      // すべての非同期処理が完了するのを待つ
      await Promise.all(promises);
    } catch (error) {
      console.log(error);
    } finally {
      // 非同期処理がすべて完了した後に実行
      $nowProgress = false;
      uploadAbortController = null;
    }
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
    // 矢印キーが押された場合にのみカーソル位置を更新
    if (
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      setTimeout(() => {
        // setTimeoutしないと古いカーソル位置を取得する可能性があるらしい
        //setTimeout を使って次のイベントループサイクルにカーソル位置の更新を延期
        //確実に最新のカーソル位置が cursorPosition に反映されるようになります。
        cursorPosition = textarea.selectionStart;
      }, 0);
    }
  };

  const keyboardShortcut = (event: KeyboardEvent) => {
    event.preventDefault();
    const activeElement = document.activeElement;
    if ($open === true && event.key === "Escape") {
      clickEscape++;
      if (clickEscape >= 2) {
        clickEscape = 0;
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

  //--------------userlist
  let metadataList: MetadataList = {};

  function setMetadataList() {
    try {
      const metadataStr = localStorage.getItem("metadata");
      let metadataQueryData: [QueryKey, EventPacket][] = metadataStr
        ? JSON.parse(metadataStr)
        : [];
      metadataList = getMetadataList(metadataQueryData);
    } catch (error) {}
  }

  let viewMetadataList: boolean;
  let inputMetadata: string = "";
  $: if (viewMetadataList) {
    setMetadataList();
  }
  function checkUserInput(inputMetadata: string, arg1: UserData) {
    if (inputMetadata === "") {
      return true;
    }
    if (
      (arg1.name &&
        arg1.name.toLowerCase().includes(inputMetadata.toLowerCase())) ||
      (arg1.display_name &&
        arg1.display_name
          .toLowerCase()
          .includes(inputMetadata.toLowerCase())) ||
      (arg1.nip05 &&
        arg1.nip05.toLowerCase().includes(inputMetadata.toLowerCase()))
    ) {
      return true;
    }
    return false;
  }

  function handleClickUser(pub: string): any {
    //tags.push(["p", nip19.decode(pub).data as string]);

    const emojiText = ` nostr:${pub} `;
    text =
      text.slice(0, cursorPosition) + emojiText + text.slice(cursorPosition);
    cursorPosition += emojiText.length;
    viewMetadataList = false;
    textarea.focus();
  }
</script>

<svelte:window on:keyup={keyboardShortcut} on:keydown={handleKeyDown} />
<button
  title="open post window"
  use:melt={$trigger}
  class="inline-flex items-center justify-center rounded-full bg-white border border-magnum-700 p-3.5
  font-medium leading-none text-magnum-700 shadow hover:opacity-75 z-30"
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
            max-w-[90vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
      use:melt={$content}
    >
      {#if signPubkey && (initOptions.tags.length > 0 || (initOptions.content && initOptions.content.length > 0) || ($showImg && $showPreview))}
        <div
          class="rounded-md bg-neutral-900
            p-6 pt-3 shadow-lg mb-4"
        >
          <div class="font-medium text-magnum-400">preview</div>
          <div class="border border-magnum-500 rounded-md">
            <EventCard
              {metadata}
              note={{
                sig: "",
                id: "",
                pubkey: signPubkey,
                content: text,
                tags: tags,
                kind: initOptions.kind,
                created_at: now(),
              }}
              displayMenu={false}
              repostable={false}
              maxHeight={"10rem"}
              tieKey={undefined}
            />
          </div>
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
            disabled={isPosting}
            class={`inline-flex h-24 w-full flex-1 items-center justify-center rounded-sm border  p-2 leading-none disabled:opacity-20 ${nsecCheck ? "bg-red-500/20" : "bg-neutral-800 "}`}
            id="note"
            bind:this={textarea}
            bind:value={text}
            on:input={(e) => {
              handleTextareaInput(e);
              clickEscape = 0;
            }}
            on:click={(e) => {
              handleTextareaInput(e);
              clickEscape = 0;
            }}
            on:touchend={(e) => {
              handleTextareaInput(e);
              clickEscape = 0;
            }}
            on:paste={(e) => {
              paste(e);
              clickEscape = 0;
            }}
            on:drop={(e) => {
              handleDrop(e);
              clickEscape = 0;
            }}
            on:dragover={(e) => {
              handleDragOver(e);
              clickEscape = 0;
            }}
            placeholder="いま どうしてる？"
          />
        </fieldset>

        {#if onWarning}
          <div class="flex">
            <div class="mt-auto mb-auto text-sm break-keep">理由：</div>
            <input
              type="text"
              class="px-1 h-8 w-full rounded-md text-magnum-100 border-2
            border-magnum-400"
              bind:value={warningText}
            />
          </div>
          <!--{:else}<div class="h-4" />-->{/if}
        {#if nsecCheck}
          <div class="text-sm text-red-500　">
            {$_("post.nsecAlart")}
          </div>
        {/if}
        <div class="mt-2 flex justify-between gap-2">
          <button
            on:click={() => {
              onWarning = !onWarning;
            }}
            class="inline-flex h-8 min-w-10 items-center justify-center rounded-sm
                    bg-zinc-100 font-medium leading-none text-zinc-600 hover:opacity-75 active:opacity-50"
          >
            <TriangleAlert
              size="20"
              class="stroke-magnum-500 {onWarning ? 'fill-magnum-700 ' : ''}"
            />
          </button>

          <div class=" flex gap-2">
            <!--emojis-->
            {#if $emojis && $emojis.length > 0}
              {#if viewCustomEmojis}
                <input
                  type="text"
                  class="h-8 w-full rounded-md text-magnum-100 border-2
            border-magnum-400"
                  bind:value={customReaction}
                />
              {/if}
              <button
                aria-label="open custom emoji list"
                on:click={() => {
                  viewCustomEmojis = !viewCustomEmojis;
                  if (viewMetadataList && viewCustomEmojis) {
                    viewMetadataList = false;
                  }
                }}
                class="inline-flex h-8 min-w-10 items-center justify-center rounded-sm
                    bg-zinc-100 font-medium leading-none text-zinc-600 hover:opacity-75 active:opacity-50"
              >
                <SmilePlus
                  size="20"
                  class={viewCustomEmojis
                    ? "fill-magnum-700 stroke-magnum-500"
                    : ""}
                />
              </button>
            {/if}
            <!--userdata-->

            {#if viewMetadataList}
              <input
                type="text"
                class="h-8 w-full rounded-md text-magnum-100 border-2
         border-magnum-400"
                bind:value={inputMetadata}
              />
            {/if}
            <button
              aria-label="open custom emoji list"
              on:click={() => {
                viewMetadataList = !viewMetadataList;
                if (viewMetadataList && viewCustomEmojis) {
                  viewCustomEmojis = false;
                }
              }}
              class="inline-flex h-8 min-w-10 items-center justify-center rounded-sm
                 bg-zinc-100 font-medium leading-none text-zinc-600 hover:opacity-75 active:opacity-50"
            >
              <UserPlus
                size="20"
                class={viewMetadataList
                  ? "fill-magnum-700 stroke-magnum-500"
                  : ""}
              />
            </button>

            <!---->
            <button
              disabled={isPosting}
              aria-label="post note"
              class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-magnum-100 px-4 font-medium leading-none text-magnum-900 hover:opacity-75 active:opacity-50 disabled:opacity-20"
              on:click={postNote}
            >
              <Send size="20" />
            </button>
          </div>
        </div>
        <!--emojis-->
        {#if viewCustomEmojis}
          <div
            class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
          >
            {#each $emojis as e, index}
              {#if customReaction === "" || e[0]
                  .toLowerCase()
                  .includes(customReaction.toLowerCase())}
                <button
                  aria-label={`Select emoji ${e[0]}`}
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
        <!--metadataList-->
        {#if viewMetadataList}
          <div
            class="rounded-sm mt-2 border border-magnum-600 flex flex-wrap pt-2 max-h-40 overflow-y-auto"
          >
            {#each Object.entries(metadataList) as [pubkey, profile], index}
              {#if checkUserInput(inputMetadata, profile)}
                <button
                  aria-label={`Select profile ${profile.display_name || profile.name || pubkey}`}
                  on:click={() => handleClickUser(pubkey)}
                  class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
                >
                  {profile.display_name ?? ""}@{profile.name ?? ""}
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
