<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import { MessagesSquare, X, Plus, Minus } from "lucide-svelte";
  import { fade } from "svelte/transition";
  import { t as _ } from "@konemono/svelte5-i18n";
  import * as Nostr from "nostr-typedef";
  import {
    nowProgress,
    popStack,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";

  import { clientTag } from "$lib/func/constants";
  import InputImageFromFile from "../[npub=npub]/profile/InputImageFromFile.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import { formatToEventPacket, generateResultMessage } from "$lib/func/util";
  import type { EventPacket } from "rx-nostr";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import { safePublishEvent } from "$lib/func/publishError";

  let querykey: QueryKey = $derived(["kind10005", lumiSetting.get().pubkey]);

  // フォームの状態を管理
  let channelName = $state("");
  let channelAbout = $state("");
  let channelPicture = $state("");
  let categories = $state([{ value: "" }]);
  let addToList = $state(true);
  let error = $state("");

  // カテゴリー追加
  const addCategory = () => {
    categories = [...categories, { value: "" }];
  };

  // カテゴリー削除
  const removeCategory = (index: number) => {
    categories = categories.filter((_, i) => i !== index);
  };

  // カテゴリー更新
  const updateCategory = (index: number, value: string) => {
    categories = categories.map((cat, i) => (i === index ? { value } : cat));
  };
  const id = "createChannel";
  const handleClickCreate = () => {
    $dialogOpen = true;
    pushState("", {
      dialogOpen: {
        id: id,
      },
    });
  };

  // ブラウザバックなどでpopStackからナビゲーション変更があった場合
  $effect(() => {
    const logEntry = $popStack?.[0]?.id === id;

    if (logEntry) {
      untrack(() => {
        $dialogOpen = false;

        popStack.update((stack) => stack.filter((entry) => entry.id !== id));
      });
    }
  });

  // 外部からのページ状態変更を監視
  $effect(() => {
    const currentDialogState = page.state?.dialogOpen?.id === id;
    if ($dialogOpen && !currentDialogState) {
      untrack(() => {
        $dialogOpen = false;
      });
    }
  });

  // チャンネル作成処理
  const createChannel = async () => {
    if (!channelName.trim()) {
      error = `${$_("channel.create.errorNameRequired")}`;
      return;
    }

    $nowProgress = true;
    error = "";

    try {
      // チャンネルメタデータの作成
      const channelMetadata = {
        name: channelName.trim(),
        about: channelAbout.trim(),
        picture: channelPicture.trim(),
      };

      // tags の作成
      const tags: string[][] = [];

      // カテゴリータグを追加
      categories.forEach((cat) => {
        if (cat.value.trim()) {
          tags.push(["t", cat.value.trim()]);
        }
      });

      if (lumiSetting.get().addClientTag) {
        // クライアントタグを追加
        tags.push(clientTag);
      }

      // 新しいイベントを作成（実際のアプリに合わせて調整）
      const newChannelEvent: Nostr.EventParameters = {
        kind: 40,
        content: JSON.stringify(channelMetadata),
        tags: $state.snapshot(tags),
        created_at: Math.floor(Date.now() / 1000),
      };

      console.log("Creating channel:", newChannelEvent);

      const result = await safePublishEvent(newChannelEvent);
      if ("errorCode" in result) {
        if (result.isCanceled) {
          return; // キャンセル時は何もしない
        }
        $toastSettings = {
          title: "Error",
          description: $_(result.errorCode),
          color: "bg-red-500",
        };
        return;
      }
      // 成功時の処理
      const { event: ev, res } = result;
      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
      const message = generateResultMessage(isSuccess, isFailed);
      $toastSettings = {
        title: isSuccess.length > 0 ? "Success" : "Failed",
        description: message,
        color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
      };

      if (addToList) {
        // チャンネルリスト(kind 10005)に追加する処理
        await addChannelToList(ev.id);
      }

      // 完了メッセージと画面遷移
      //alert($_("channel.create.success"));

      // ダイアログを閉じる
      closeDialog();

      // 作成したチャンネルページに遷移する場合（オプション）
      // window.location.href = `/channel/${nip19.noteEncode(mockEventId)}`;
    } catch (err) {
      console.error("チャンネル作成エラー:", err);
      error = `${$_("channel.create.error")}`;
    } finally {
      $nowProgress = false;
    }
  };

  // チャンネルをリストに追加する処理
  const addChannelToList = async (channelId: string) => {
    try {
      // 現在のKind 10005を取得
      const kind10005data: EventPacket | undefined =
        queryClient.getQueryData(querykey);
      if (kind10005data) {
        // 新しいタグリストを作成
        const newTags = [...kind10005data.event.tags, ["e", channelId]];

        // 新しいイベントを作成して送信
        // 新しいイベントを作成
        const newEvent: Nostr.EventParameters = {
          kind: 10005,
          content: "",
          tags: $state.snapshot(newTags),
          created_at: Math.floor(Date.now() / 1000),
        };

        // イベントを送信する処理（実際のアプリケーションに合わせて実装）
        const result = await safePublishEvent(newEvent);
        if ("errorCode" in result) {
          if (result.isCanceled) {
            return; // キャンセル時は何もしない
          }
          $toastSettings = {
            title: "Error",
            description: $_(result.errorCode),
            color: "bg-red-500",
          };
          return;
        }
        // 成功時の処理
        const { event: signedkind10005, res } = result;
        console.log("イベントを送信:", signedkind10005);

        const isSuccess = res
          .filter((item) => item.ok)
          .map((item) => item.from);
        const isFailed = res
          .filter((item) => !item.ok)
          .map((item) => item.from);
        const message = generateResultMessage(isSuccess, isFailed);
        $toastSettings = {
          title: isSuccess.length > 0 ? "Success" : "Failed",
          description: message,
          color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
        };

        if (isSuccess.length > 0) {
          // 成功したら状態を更新

          queryClient.setQueryData(
            querykey,
            formatToEventPacket(signedkind10005)
          );
        }

        console.log("Added channel to list:", channelId);
      } else {
        throw new Error("Failed to fetch kind 10005 data");
      }
    } catch (err) {
      console.error("リスト追加エラー:", err);
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
    channelName = "";
    channelAbout = "";
    channelPicture = "";
    categories = [{ value: "" }];
    addToList = true;
    error = "";

    // ダイアログを閉じる
    $dialogOpen = false;
  };
</script>

<!--作ったら自動で10005にも入るようにしよう-->

<button
  onclick={handleClickCreate}
  class="border border-magnum-500 rounded-md p-2 font-bold self-start text-magnum-400 hover:bg-magnum-500/10 active:bg-magnum-500/20 flex items-center"
>
  <MessagesSquare class="mr-1" />Create New Channel
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
        {$_("channel.create.title")}
      </h2>

      <div class="overflow-y-auto px-1">
        {#if error}
          <div
            class="bg-red-900/30 border border-red-500 rounded-md p-3 mb-4 text-red-200"
          >
            {error}
          </div>
        {/if}

        <!-- name -->

        <label class="block text-neutral-300 mb-4"
          >{$_("channel.create.name")} *
          <input
            type="text"
            bind:value={channelName}
            class="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
            placeholder={$_("channel.create.namePlaceholder")}
          /></label
        >

        <!-- about -->

        <label class="block text-neutral-300 mb-4"
          >{$_("channel.create.about")}
          <textarea
            bind:value={channelAbout}
            class="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white min-h-24 resize-y"
            placeholder={$_("channel.create.aboutPlaceholder")}
          ></textarea>
        </label>

        <!-- picture -->

        <label class="flex mb-2 items-end justify-between"
          >{$_("channel.create.picture")}

          <InputImageFromFile bind:inputText={channelPicture} />
        </label>
        <div class="flex gap-2 sm:flex-row flex-col mb-2">
          <input
            type="text"
            bind:value={channelPicture}
            class="flex-1 bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white h-fit"
            placeholder="https://..."
          />
          <div
            class="w-24 h-24 bg-neutral-800 border border-neutral-700 rounded-md overflow-hidden flex items-center justify-center"
          >
            {#if channelPicture}
              <img
                src={channelPicture}
                alt="Preview"
                class="max-w-full max-h-full object-cover"
              />{:else}<span class="text-neutral-600">Preview</span>
            {/if}
          </div>
        </div>

        <!-- category -->

        <label class="block text-neutral-300 mb-6"
          >{$_("channel.create.categories")}
          {#each categories as category, index}
            <div class="flex gap-2 mb-2 text-neutral-100">
              <input
                type="text"
                value={category.value}
                oninput={(e) =>
                  updateCategory(index, (e.target as HTMLInputElement)?.value)}
                class="flex-1 bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
                placeholder={$_("channel.create.categoryPlaceholder")}
              />
              <button
                onclick={() => removeCategory(index)}
                disabled={categories.length === 1}
                class="p-2 bg-red-900/20 border border-red-500 rounded-md disabled:opacity-50"
                aria-label="Remove category"
              >
                <Minus size={18} />
              </button>
            </div>
          {/each}
          <button
            onclick={addCategory}
            class="p-2 bg-green-900/20 border border-green-500 rounded-md flex items-center mt-2"
          >
            <Plus size={18} class="mr-1" />
            {$_("channel.create.addCategory")}
          </button>
        </label>

        <!-- Add to personal list option -->

        <label class="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            bind:checked={addToList}
            class="h-4 w-4 rounded bg-neutral-700"
          />
          <span>{$_("channel.create.addToList")}</span>
        </label>
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
          onclick={createChannel}
          disabled={$nowProgress}
          class="inline-flex h-10 items-center justify-center rounded-md
                  bg-magnum-600 hover:bg-magnum-700 px-6 font-medium leading-none text-white
                  disabled:bg-magnum-800 disabled:opacity-70"
        >
          {$_("channel.create.submit")}
        </button>
      </div>

      <button
        use:melt={$close}
        aria-label="close"
        onclick={closeDialog}
        class="absolute right-4 top-4 inline-flex appearance-none
        items-center justify-center rounded-full p-1 text-magnum-800
        hover:bg-magnum-300 focus:shadow-magnum-400 bg-magnum-100"
      >
        <X class="size-6" />
      </button>
    </div>
  </div>
{/if}
