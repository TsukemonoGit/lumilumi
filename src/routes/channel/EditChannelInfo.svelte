<script lang="ts">
  import { Plus, Minus } from "lucide-svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import * as Nostr from "nostr-typedef";
  import { defaultRelays, nowProgress, queryClient } from "$lib/stores/stores";
  import { clientTag } from "$lib/func/constants";
  import InputImageFromFile from "../[npub=npub]/profile/InputImageFromFile.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { getRelayById } from "$lib/func/nostr";
  import { formatToEventPacket, generateResultMessage } from "$lib/func/util";

  import type { ChannelData } from "$lib/types";
  import { safePublishEvent } from "$lib/func/publishError";
  import { addToast } from "$lib/components/Elements/Toast.svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";

  interface Props {
    editChannelDataOpen: boolean;
    heyaId: string;
    note: Nostr.Event; //kind40か41
    channelData: ChannelData;
  }
  let {
    editChannelDataOpen = $bindable(),
    heyaId,
    note,
    channelData,
  }: Props = $props();

  // フォームの状態を管理
  let channelName = $derived(channelData.name);
  let channelAbout = $derived(channelData.about || "");
  let channelPicture = $derived(channelData.picture || "");
  let categories = $derived(
    note.tags.reduce<{ value: string }[]>((a, b) => {
      if (b[0] === "t") {
        return [...a, { value: b[1] }];
      } else {
        return a;
      }
    }, [])
  );
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
        relays: Object.keys($defaultRelays).slice(0, 6),
      };
      const relayhint = getRelayById(note.id);
      // tags の作成
      const tags: string[][] = [["e", heyaId, relayhint, "root", note.pubkey]];

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
        kind: 41,
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
        ["channel", "kind41", heyaId],
        formatToEventPacket(ev)
      );
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

  const closeDialog = () => {
    // フォームをリセット
    channelName = "";
    channelAbout = "";
    channelPicture = "";
    categories = [{ value: "" }];
    addToList = true;
    error = "";

    // ダイアログを閉じる
    editChannelDataOpen = false;
  };
</script>

<Dialog bind:open={editChannelDataOpen} id="editChannelInformation">
  {#snippet title()}
    {$_("channel.edit.title")}
  {/snippet}
  {#snippet main()}
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
        {$_("channel.edit.submit")}
      </button>
    </div>
  {/snippet}
</Dialog>
