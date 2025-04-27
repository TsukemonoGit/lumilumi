<script lang="ts">
  import { _ } from "svelte-i18n";
  import { createDialog, melt } from "@melt-ui/svelte";
  import type { Writable } from "svelte/store";
  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { latest, type EventPacket } from "rx-nostr";
  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { pipe } from "rxjs";
  import ChannelMetadata from "$lib/components/NostrElements/kindEvents/ChannelMetadata.svelte";
  import { nip19 } from "nostr-tools";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { formatToEventPacket, generateResultMessage } from "$lib/func/util";

  interface Props {
    editChannelListOpen: Writable<boolean>;
    heyaId: string;
    tieKey: string | undefined;
  }
  let { editChannelListOpen = $bindable(), heyaId, tieKey }: Props = $props();
  let querykey: QueryKey = $derived(["kind10005", $loginUser]);
  let kind10005: Nostr.Event | undefined = $state();

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
  let includeHeyaId = $state(false);

  editChannelListOpen.subscribe(async (value) => {
    if (value) {
      $dialogOpen = true;
      console.log("open", value);

      // 最新の10005を取得する
      $nowProgress = true;

      const kind10005data: EventPacket | undefined =
        queryClient.getQueryData(querykey);

      const newKind10005: EventPacket[] = await usePromiseReq(
        {
          filters: [{ kinds: [10005], authors: [$loginUser], limit: 1 }],
          operator: pipe(latest()),
        },
        undefined,
        3000
      );

      if (
        newKind10005 &&
        newKind10005.length > 0 &&
        (!kind10005data ||
          newKind10005[0].event.created_at > kind10005data.event.created_at)
      ) {
        kind10005 = newKind10005[0].event;
        queryClient.setQueryData(querykey, kind10005);
      } else if (kind10005data) {
        kind10005 = kind10005data.event;
      }

      $nowProgress = false;

      // heyaIDが入ってるか確認
      if (
        kind10005 &&
        kind10005.tags.find((tag) => tag[0] === "e" && tag[1] === heyaId)
      ) {
        console.log("含まれているので削除する？");
        includeHeyaId = true;
      } else {
        console.log("含まれていないので追加する？");
        includeHeyaId = false;
      }
    }
  });

  async function updateChannelList() {
    $nowProgress = true;

    // 新しいタグリストを作成
    let newTags: string[][] = kind10005 ? [...kind10005.tags] : [];

    if (includeHeyaId) {
      // 既に含まれている場合は削除
      newTags = newTags.filter((tag) => !(tag[0] === "e" && tag[1] === heyaId));
    } else {
      // 含まれていない場合は追加
      newTags.push(["e", heyaId]);
    }

    // 新しいイベントを作成
    const newEvent: Nostr.EventParameters = {
      kind: 10005,
      content: "",
      tags: newTags,
      created_at: Math.floor(Date.now() / 1000),
    };

    try {
      // イベントを送信する処理（実際のアプリケーションに合わせて実装）
      const { event: ev, res } = await promisePublishEvent(newEvent);
      console.log("イベントを送信:", ev);

      const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
      const isFailed = res.filter((item) => !item.ok).map((item) => item.from);
      const message = generateResultMessage(isSuccess, isFailed);
      $toastSettings = {
        title: isSuccess.length > 0 ? "Success" : "Failed",
        description: message,
        color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
      };

      if (isSuccess.length > 0) {
        // 成功したら状態を更新
        kind10005 = ev;
        includeHeyaId = !includeHeyaId;
        queryClient.setQueryData(querykey, formatToEventPacket(kind10005));

        // ダイアログを閉じる
        $dialogOpen = false;
        $editChannelListOpen = false;
      }
    } catch (error) {
      console.error("イベント送信エラー:", error);
      // エラー処理
    } finally {
      $nowProgress = false;
    }
  }

  function closeDialog() {
    $dialogOpen = false;
    $editChannelListOpen = false;
  }
</script>

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
      <h2 use:melt={$title} class="m-0 text-lg font-medium">
        {$_("channel.menu.edit")}
      </h2>

      {#if $nowProgress}
        loading...
      {:else}
        <div class="mt-2 mb-4">
          {#if includeHeyaId}
            <div class="p-3 bg-red-900/20 rounded-lg border border-red-500">
              <!-- 追加または削除しようとしている部屋ID -->
              <ChannelMetadata
                id={heyaId}
                {tieKey}
                clickAction={false}
                linkButtonTitle={`/channel/${nip19.noteEncode(heyaId)}`}
              />
              <p class="mt-4">{$_("channel.menu.removeConfirm")}</p>
              <button
                class="mt-2 bg-red-600/90 hover:bg-red-700/90 text-white font-medium py-2 px-4 rounded-md"
                onclick={updateChannelList}
              >
                {$_("channel.menu.remove")}
              </button>
            </div>
          {:else}
            <div class="p-3 bg-green-900/30 rounded-lg border border-green-500">
              <!-- 追加または削除しようとしている部屋ID -->
              <ChannelMetadata
                id={heyaId}
                {tieKey}
                clickAction={false}
                linkButtonTitle={`/channel/${nip19.noteEncode(heyaId)}`}
              />
              <p class="mt-4">{$_("channel.menu.addConfirm")}</p>
              <button
                class="mt-2 bg-green-600/90 hover:bg-green-700/90 text-white font-medium py-2 px-4 rounded-md"
                onclick={updateChannelList}
              >
                {$_("channel.menu.add")}
              </button>
            </div>
          {/if}
        </div>

        <!-- 現状のリスト状況を表示 -->
        <div class="mt-4">
          <p class="font-medium text-gray-300 mb-2">
            {$_("channel.menu.currentList")}
          </p>
          <div
            class="border border-magnum-500 rounded-lg divide-y divide-magnum-500 max-h-60 overflow-y-auto"
          >
            {#if !kind10005}
              No Channel List (kind:10005)
            {:else}
              {#each kind10005.tags.filter((tag) => tag[0] === "e") as [tag, id]}
                <ChannelMetadata
                  clickAction={false}
                  {id}
                  linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
                  {tieKey}
                />
              {/each}{/if}
          </div>
        </div>
      {/if}

      <div class="mt-4 flex justify-end gap-4">
        <button
          onclick={closeDialog}
          class="inline-flex h-8 items-center justify-center rounded-sm
                      bg-zinc-100 px-4 font-medium leading-none text-zinc-600 hover:bg-zinc-200"
        >
          {$_("common.close")}
        </button>
      </div>

      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                  items-center justify-center rounded-full p-1 text-magnum-800
                  hover:bg-magnum-300 focus:shadow-magnum-400 bg-magnum-100"
        onclick={closeDialog}
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
{/if}
