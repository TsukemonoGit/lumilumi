<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { Users } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { t as _ } from "@konemono/svelte5-i18n";
  import * as Nostr from "nostr-typedef";
  import {
    defaultRelays,
    nowProgress,
    popStack,
    queryClient,
  } from "$lib/stores/stores";

  import InputImageFromFile from "../[npub=npub]/profile/InputImageFromFile.svelte";

  import { formatToEventPacket, generateResultMessage } from "$lib/func/util";
  import type { EventPacket } from "rx-nostr";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import CloseButton from "$lib/components/Elements/CloseButton.svelte";
  import { addToast } from "$lib/components/Elements/Toast.svelte";

  let { queryKey } = $props();

  // フォームの状態を管理
  let listTitle: string = $state("");
  let listDescription: string = $state("");
  let listImage: string = $state("");

  let error = $state("");

  const pushstateID = "createList";
  const handleClickCreate = () => {
    $dialogOpen = true;
    pushState("", {
      dialogOpen: {
        id: pushstateID,
      },
    });
  };

  // ブラウザバックなどでpopStackからナビゲーション変更があった場合
  $effect(() => {
    const logEntry = $popStack?.[0]?.id === pushstateID;

    if (logEntry) {
      untrack(() => {
        $dialogOpen = false;

        popStack.update((stack) =>
          stack.filter((entry) => entry.id !== pushstateID),
        );
      });
    }
  });

  // 外部からのページ状態変更を監視
  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === pushstateID;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => {
        $dialogOpen = false;
      });
    }
  });

  // チャンネル作成処理
  const createList = async () => {
    $nowProgress = true;
    error = "";

    try {
      // 新しいイベントを作成（実際のアプリに合わせて調整）
      const newListEvent: Nostr.EventParameters = {
        kind: 30000,
        content: "",
        tags: [
          ["d", Math.floor(Date.now() / 1000).toString()],
          ["title", listTitle],
          ["description", listDescription],
          ["image", listImage],
        ],
        created_at: Math.floor(Date.now() / 1000),
      };

      console.log("Creating List:", newListEvent);

      const result = await safePublishEvent(newListEvent);
      if ("errorCode" in result) {
        if (result.isCanceled) {
          return; // キャンセル時は何もしない
        }
        addToast({
          data: {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          },
        });
        return;
      }
      // 成功時の処理
      const { event: ev, res } = result;
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
      const message = generateResultMessage(isSuccess, isFailed);
      addToast({
        data: {
          title: isSuccess.length > 0 ? "Success" : "Failed",
          description: message,
          color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
        },
      });

      queryClient.setQueryData(
        queryKey,
        (oldData: EventPacket[] | undefined) => {
          const newData = formatToEventPacket(ev);
          return oldData ? [newData, ...oldData] : [newData];
        },
      );

      // ダイアログを閉じる
      closeDialog();
    } catch (err) {
      console.error("リスト作成エラー:", err);
      error = `${$_("list.create.error")}`;
    } finally {
      $nowProgress = false;
    }
  };

  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open: dialogOpen },
  } = createDialog({
    forceVisible: true,
    closeOnOutsideClick: false,
  });

  const closeDialog = () => {
    // フォームをリセット
    listTitle = "";
    listDescription = "";
    listImage = "";

    error = "";

    // ダイアログを閉じる
    $dialogOpen = false;
  };
</script>

<button
  onclick={handleClickCreate}
  class="border border-magnum-500 rounded-md p-2 font-bold self-start text-magnum-400 hover:bg-magnum-500/10 active:bg-magnum-500/20 flex items-center"
>
  <Users class="mr-1" />Create New List
</button>

{#if $dialogOpen}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class={`fixed inset-0 bg-black/50`}
      style={`z-index:10`}
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class={`fixed left-1/2 top-1/2 max-h-[90vh] w-[calc(min(96vw,720px))]
               -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
               p-2 sm:p-6 shadow-lg overflow-hidden grid grid-rows-[auto_1fr_auto]`}
      style={`z-index:10`}
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium mb-4">
        {$_("list.create.title")}
      </h2>

      <div class="overflow-y-auto px-1">
        {#if error}
          <div
            class="bg-red-900/30 border border-red-500 rounded-md p-3 mb-4 text-red-200"
          >
            {error}
          </div>
        {/if}

        <!-- title -->

        <label class="block text-neutral-300 mb-4"
          >{$_("list.create.title")}
          <input
            type="text"
            bind:value={listTitle}
            class="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
            placeholder={$_("list.create.titlePlaceholder")}
          /></label
        >

        <!-- about -->

        <label class="block text-neutral-300 mb-4"
          >{$_("list.create.description")}
          <textarea
            bind:value={listDescription}
            class="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white min-h-24 resize-y"
            placeholder={$_("list.create.descPlaceholder")}
          ></textarea>
        </label>

        <!-- picture -->

        <label class="flex mb-2 items-end justify-between"
          >{$_("list.create.image")}

          <InputImageFromFile bind:inputText={listImage} />
        </label>
        <div class="flex gap-2 sm:flex-row flex-col mb-2">
          <input
            type="text"
            bind:value={listImage}
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white h-fit"
            placeholder="https://..."
          />
          <div
            class="w-24 h-24 bg-neutral-800 border border-neutral-700 rounded-md overflow-hidden flex items-center justify-center"
          >
            {#if listImage}
              <img
                src={listImage}
                alt="Preview"
                class="max-w-full max-h-full object-cover"
              />{:else}<span class="text-neutral-600">Preview</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-4">
        <!-- キャンセル -->
        <button
          onclick={closeDialog}
          class="inline-flex h-10 items-center justify-center rounded-md
                  bg-neutral-800 border border-neutral-700 px-4 font-medium leading-none text-white"
        >
          {$_("common.cancel")}
        </button>

        <!-- 作成 -->
        <button
          onclick={createList}
          disabled={$nowProgress}
          class="inline-flex h-10 items-center justify-center rounded-md
                  bg-magnum-600 hover:bg-magnum-700 px-6 font-medium leading-none text-white
                  disabled:bg-magnum-800 disabled:opacity-70"
        >
          {$_("list.create.submit")}
        </button>
      </div>

      <CloseButton useMelt={$close} ariaLabel="close" onclick={closeDialog} />
    </div>
  </div>
{/if}
