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
    Quote,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import {
    getDefaultWriteRelays,
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
  import {
    filesUpload,
    delay,
    normalizeRelayURL,
    displayShortPub,
  } from "$lib/func/util";

  import type { FileUploadResponse } from "nostr-tools/nip96";
  import type {
    DefaultPostOptions,
    MargePostOptions,
    Profile,
  } from "$lib/types";
  import EventCard from "./NostrElements/kindEvents/EventCard/EventCard.svelte";
  import { nip07Signer, now, type EventPacket } from "rx-nostr";
  import { writable, type Writable } from "svelte/store";

  import type { QueryKey } from "@tanstack/svelte-query";
  import { nsecRegex } from "$lib/func/regex";
  import { clientTag } from "$lib/func/constants";

  import Content from "./NostrElements/content/Content.svelte";
  import { convertMetaTags } from "$lib/func/imeta";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserName from "./NostrElements/user/UserName.svelte";

  import AlertDialog from "./Elements/AlertDialog.svelte";

  interface Props {
    //チャンネルの情報をあらかじめ入れておく。とかと別でリプライユーザーとかをいれる必要があるから、リプとかのときのオプションと別にする
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
    propSignPubkey, //画像共有のときに画像をアップするときにsignPub取得するからその時にある
    visible = true, //ポストアイコン非表示だけど返信とかはできる
  }: Props = $props();
  const zIndex = 50;
  const bulkReplyThreshold = 30; // 30人以上でクソでか人数ライン
  let text: string = $state(options.content ?? "");
  let tags: string[][] = $state([...options.tags]);
  let cursorPosition: number = 0;
  let onWarning: boolean = $state<boolean>(false);
  let warningText = $state("");
  let customReaction: string = $state("");
  let viewCustomEmojis: boolean = $state<boolean>(false);
  const selectedUploader: Writable<string> = writable();
  let files: FileList | undefined = $state();
  let fileInput: HTMLInputElement | undefined = $state();
  let initOptions: MargePostOptions = $state({
    ...options,
    kind: options.kind ?? 1,
  });
  const { elements, states } = createDialog({
    forceVisible: true,
    closeOnOutsideClick: false, //overlay押したときに閉じない

    escapeBehavior: "ignore",
  });
  const { trigger, overlay, content, close, portalled } = elements;
  const { open } = states;

  //$: console.log(initOptions.tags);
  let metadata: Nostr.Event | undefined = $state(undefined);

  const additionalReplyUsers: Writable<string[]> = writable([]);
  let clickEscape: number = $state(0);
  let signPubkey: string | undefined = $state();
  let textarea: HTMLTextAreaElement | undefined = $state();
  let warningTextarea: HTMLInputElement | undefined = $state();

  async function getSignPubkey() {
    if (propSignPubkey) {
      //共有からポストウィンドウを開いたとき
      signPubkey = propSignPubkey;
      return;
    }
    $nowProgress = true;
    try {
      const pub = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();

      if (pub) {
        console.log(pub);
        signPubkey = pub;

        metadata = (
          queryClient.getQueryData(["metadata", signPubkey]) as EventPacket
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
  let uploadAbortController: AbortController | null = $state(null);

  let isPosting: boolean = $state(false);
  // svelte-ignore non_reactive_update
  let openHellConfirm: (bool: boolean) => void;
  let newev: Nostr.EventParameters | undefined;

  const postNote = async () => {
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
    if (lumiSetting.get().addClientTag) {
      checkedTags.push(clientTag);
    }

    newev = {
      kind: initOptions.kind,
      content: checkedText,
      tags: checkedTags,
    };
    //くそながpタグチェック
    const plen = checkedTags.filter((tag) => tag[0] === "p").length;
    if (plen > bulkReplyThreshold) {
      //pが長いけど送信していいかのチェック画面
      openHellConfirm(true);
      return;
    }
    await sendEvent();
  };

  async function sendEvent() {
    if (!newev) {
      return;
    }
    isPosting = true;
    $nowProgress = true;
    const signer = nip07Signer();
    try {
      const event = await signer.signEvent($state.snapshot(newev));
      console.log(event);
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
    } catch (error) {
      console.log(error);
      $toastSettings = {
        title: "Failed",
        description: "failed to publish",
        color: "bg-red-500",
      };
      $nowProgress = false;
      isPosting = false;
    }
    newev = undefined;
  }

  const resetState = () => {
    text = options.content ?? "";
    tags = [...options.tags];
    warningText = "";
    onWarning = false;
    viewCustomEmojis = false;
    customReaction = "";
    $additionalReplyUsers = [];
    initOptions = { ...options, kind: options.kind ?? 1 };
    viewMetadataList = false;
    inputMetadata = "";
  };

  const handleTextareaInput = (event: Event) => {
    const target = event.target as HTMLTextAreaElement;
    cursorPosition = target.selectionStart;
  };
  const addEmojiTag = (emoji: string[]) => {
    // 1. URLが同じ絵文字を探す
    const sameEmoji = tags.find(
      (tag) => tag[0] === "emoji" && tag[2] === emoji[1] // URLが同じ
    );

    if (sameEmoji) {
      // 同じURLの絵文字があれば、その名前を使う
      emoji[0] = sameEmoji[1];
    }

    // 2. 同じ名前の絵文字があるか確認
    const sameNameEmoji = tags.find(
      (tag) => tag[0] === "emoji" && tag[1] === emoji[0]
    );

    // 3. 絵文字の条件に従って追加処理
    if (sameNameEmoji) {
      // 名前が同じでURLが異なる場合、新しい名前を付けて追加
      if (sameNameEmoji[2] !== emoji[1]) {
        emoji[0] = `${emoji[0]}_`;
        tags.push(["emoji", ...emoji]);
      }
      // 完全に同じ名前・URLの絵文字がある場合は何もしない
    } else {
      // 同じ名前もURLもない場合、新しい絵文字として追加
      tags.push(["emoji", ...emoji]);
    }
  };
  const handleClickEmoji = (e: string[]) => {
    const emoji = [...e];
    addEmojiTag(emoji);
    // 絵文字をテキストに追加
    const emojiText = `:${emoji[0]}:`;
    text =
      text.slice(0, cursorPosition) + emojiText + text.slice(cursorPosition);
    cursorPosition += emojiText.length;

    // カーソル位置を更新
    textarea?.focus();
    () => {
      textarea?.setSelectionRange(cursorPosition, cursorPosition);
    };
  };

  const handleFileUpload = async (fileList: FileList) => {
    if (!fileList || fileList.length <= 0 || !$uploader) {
      $nowProgress = false;
      return;
    }
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

            text =
              text.slice(0, cursorPosition) + urln + text.slice(cursorPosition);
            cursorPosition = len;

            // さらに10ms待機するPromise //確実にテキスト挿入完了してから次の処理をするため
            await delay(10);

            textarea?.focus();
            setTimeout(() => {
              if (textarea) textarea.selectionEnd = cursorPosition;
            }, 0);
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
    console.log(e);
    const _files = (e.target as HTMLInputElement).files;
    if (_files) {
      await handleFileUpload(_files);
    }
  };

  const paste = async (event: ClipboardEvent) => {
    console.log("[paste]", event.type, event.clipboardData);
    if (!event.clipboardData) return;

    const files = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);

    const fileList = new DataTransfer();
    files.forEach((file) => fileList.items.add(file));
    await handleFileUpload(fileList.files);

    // カスタム絵文字チェックの処理を追加
    const pastedText = event.clipboardData.getData("text");
    if (pastedText) {
      const emojiMatches = pastedText.match(/:[a-zA-Z0-9_]+:/g);
      if (emojiMatches) {
        emojiMatches.forEach((emoji) => {
          const emojiName = emoji.slice(1, -1);
          const customEmoji = $emojis.list.find((e) => e[0] === emojiName);
          if (customEmoji) {
            addEmojiTag(customEmoji);
          }
        });
      }
    }
  };

  // svelte-ignore non_reactive_update
  let openConfirm: (bool: boolean) => void = () => {};

  // オーバーレイクリック時の処理を追加
  const handleOverlayClick = (event: MouseEvent) => {
    if (text.trim().length > 0) {
      // テキストエリアに入力がある場合、アラートを表示
      openConfirm?.(true);
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
        if (textarea) {
          cursorPosition = textarea.selectionStart;
        }
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
  let metadataList: MetadataList = $derived.by(() => {
    if (viewMetadataList) {
      try {
        const metadataStr = localStorage.getItem("metadata");
        let metadataQueryData: [QueryKey, EventPacket][] = metadataStr
          ? JSON.parse(metadataStr)
          : [];
        return getMetadataList(metadataQueryData);
      } catch (error) {
        return {};
      }
    } else return {};
  });

  let viewMetadataList: boolean = $state(false);
  let inputMetadata: string = $state("");
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
        arg1.nip05.toLowerCase().includes(inputMetadata.toLowerCase())) ||
      (arg1.petname &&
        arg1.petname.toLowerCase().includes(inputMetadata.toLowerCase()))
    ) {
      return true;
    }
    return false;
  }

  async function handleClickUser(pub: string): Promise<any> {
    //tags.push(["p", nip19.decode(pub).data as string]);

    const emojiText = cursorPosition === 0 ? `nostr:${pub} ` : ` nostr:${pub} `;
    text =
      text.slice(0, cursorPosition) + emojiText + text.slice(cursorPosition);
    cursorPosition += emojiText.length;
    viewMetadataList = false;

    textarea?.focus();
    setTimeout(() => {
      textarea?.setSelectionRange(cursorPosition, cursorPosition);
    });
  }

  let emojiInput: HTMLInputElement | undefined = $state();
  let metadataInput: HTMLInputElement | undefined = $state();

  const handleClickCustomReaction = () => {
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
  };

  const handleClickMetadata = () => {
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
  };

  postWindowOpen.subscribe((value) => {
    if (value) {
      const addOption = $state.snapshot($additionalPostOptions);
      // console.log(addOption);

      if (addOption) {
        // タグをコピー

        initOptions = {
          ...options,
          kind: addOption.kind ?? options.kind ?? 1,
          //チャンネルからリプするときに optionsとadditional両方にrootがついてしまうので、ルートタグの重複をチェック
          tags: (() => {
            const combinedTags = options.tags.concat(addOption.tags);
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
          content: (options.content ?? "") + addOption.content, // contentをマージ
          addableUserList: addOption.addableUserList,
          defaultUsers: addOption.defaultUsers,
          warningText: addOption.warningText,
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
        setTimeout(() => {
          $additionalPostOptions = undefined;
        }, 0);
      }

      $open = true;
      $postWindowOpen = false;
    }
  });

  open.subscribe((value) => {
    // console.log(value);
    if (value) {
      //毎回ユーザー切り替えてないとも限らないから毎回チェックしようとしてみる
      // if (!signPubkey) {
      getSignPubkey();
      //}
      clickEscape = 0;
      // const pubkey = await (window.nostr as Nostr.Nip07.Nostr)?.getPublicKey();
      // metadata = queryClient.getQueryData(["metadata", pubkey]);
      // console.log(metadata);
      setTimeout(() => {
        //これしないとtextareaがundefinedとかnullになる
        //console.log(textarea);
        if (textarea) {
          textarea.selectionEnd = 0;
          textarea?.scroll({
            top: 0,
          });

          textarea?.focus();
        }
      }, 0);
    } else {
      if (uploadAbortController) {
        uploadAbortController.abort(); // アップロードを中断
      }
      resetState();
    }
  });

  let nsecCheck = $derived(nsecRegex.test(text) || nsecRegex.test(warningText));

  selectedUploader.subscribe((value) => {
    if (value) {
      $uploader = value;
    }
  });

  const userName = (pubkey: string, profile: UserData) => {
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
  };

  const handleClickQuote = () => {
    text =
      text.slice(0, cursorPosition) + " nostr:" + text.slice(cursorPosition);
    cursorPosition += " nostr:".length;
    textarea?.focus();
  };

  //でばっぐよう
  // $open = true;
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
  <div use:melt={$portalled}>
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
      {#if lumiSetting.get().showImg && lumiSetting.get().showPreview}
        <div
          class="rounded-md bg-neutral-900
            p-6 pt-3 shadow-lg mb-4"
        >
          <div class="font-medium text-magnum-400">preview</div>
          <div class="border border-magnum-500 rounded-md">
            {#if signPubkey}<EventCard
                {zIndex}
                {metadata}
                note={{
                  sig: "",
                  id: "",
                  pubkey: signPubkey,
                  content: text ?? "",
                  tags: tags,
                  kind: initOptions.kind,
                  created_at: now(),
                }}
                depth={1}
                displayMenu={false}
                repostable={false}
                maxHeight={160}
                tieKey={undefined}
              />
            {:else}
              <Content
                {zIndex}
                maxHeight={160}
                {text}
                {tags}
                displayMenu={false}
                repostable={false}
                depth={1}
                tieKey={undefined}
              />
            {/if}
          </div>
        </div>
      {/if}
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
          <!--{:else}<div class="h-4" />-->{/if}
        <div class="flex gap-1 mb-0.5 flex-wrap">
          {#if initOptions.defaultUsers && initOptions.defaultUsers.length > 0}
            {#each initOptions.defaultUsers as user}
              <div class=" rounded-md bg-magnum-300 text-magnum-950 w-fit px-1">
                <UserName pubhex={user} />
              </div>
            {/each}
          {/if}
          {#if initOptions.addableUserList}
            {#each initOptions.addableUserList as replyuser, index}
              <div
                class=" rounded-md {$additionalReplyUsers.includes(replyuser)
                  ? 'bg-magnum-300'
                  : 'bg-magnum-300/50'} text-magnum-950 w-fit px-1"
              >
                <UserName pubhex={replyuser} />

                {#if $additionalReplyUsers.includes(replyuser)}
                  <button
                    class=" inline-flex h-6 w-6 appearance-none align-middle
                     rounded-full p-1 text-magnum-800 bg-magnum-100
                    hover:bg-magnum-300 focus:shadow-magnum-400"
                    onclick={() => {
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
                    onclick={() => {
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
            oninput={(e) => {
              handleTextareaInput(e);
              clickEscape = 0;
            }}
            onclick={(e) => {
              handleTextareaInput(e);
              clickEscape = 0;
            }}
            ontouchend={(e) => {
              handleTextareaInput(e);
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
          <div class="text-sm text-red-500　">
            {$_("post.nsecAlart")}
          </div>
        {/if}
        <div class="mt-2 flex justify-end gap-1 md:gap-2 items-center">
          <!--emojis-->
          {#if $emojis && $emojis.list.length > 0}
            {#if viewCustomEmojis}
              <input
                bind:this={emojiInput}
                type="text"
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
          {/if}
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
            <Send size="20" class="stroke-zinc-100" />
          </button>
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
                  {#if lumiSetting.get().showImg}
                    <img
                      height="24px"
                      loading="lazy"
                      class="h-6 min-w-6 object-contain justify-self-center"
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
