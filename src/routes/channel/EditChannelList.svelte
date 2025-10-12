<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import { createDialog, melt } from "@melt-ui/svelte";
  import type { Writable } from "svelte/store";
  import { fade } from "svelte/transition";
  import * as Nostr from "nostr-typedef";
  import { latest, type EventPacket } from "rx-nostr";
  import { usePromiseReq } from "$lib/func/nostr";
  import {
    nowProgress,
    popStack,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { pipe } from "rxjs";
  import ChannelMetadata from "$lib/components/NostrElements/kindEvents/ChannelMetadata.svelte";
  import * as nip19 from "nostr-tools/nip19";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { formatToEventPacket, generateResultMessage } from "$lib/func/util";
  import { pushState } from "$app/navigation";
  import { page } from "$app/state";
  import { tick, untrack } from "svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import CloseButton from "$lib/components/Elements/CloseButton.svelte";
  import EmptyListCard from "$lib/components/NostrElements/kindEvents/layout/EmptyListCard.svelte";
  import { encodetoNote } from "$lib/func/encode";
  import ChannelMetadataLayout from "$lib/components/NostrElements/kindEvents/ChannelMetadataLayout.svelte";

  interface Props {
    editChannelListOpen: Writable<boolean>;
    heyaId: string;
  }
  let { editChannelListOpen = $bindable(), heyaId }: Props = $props();
  let querykey: QueryKey = $derived(["kind10005", lumiSetting.get().pubkey]);
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
  const id = "editChannelList";

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

  editChannelListOpen.subscribe(async (value) => {
    if (value) {
      $dialogOpen = true;
      console.log("open", value);
      pushState("", {
        dialogOpen: {
          id: id,
        },
      });
      // 最新の10005を取得する
      $nowProgress = true;
      console.log(heyaId);
      kind10005 = await getNewestData();

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

  async function getNewestData(): Promise<Nostr.Event | undefined> {
    const kind10005data: EventPacket | undefined =
      queryClient.getQueryData(querykey);
    console.log(kind10005data);
    const newKind10005: EventPacket[] = await usePromiseReq(
      {
        filters: [
          { kinds: [10005], authors: [lumiSetting.get().pubkey], limit: 1 },
        ],
        operator: pipe(latest()),
      },
      undefined,
      3000
    );
    console.log(newKind10005);
    const hasNew = newKind10005 && newKind10005.length > 0;
    const isNewer =
      hasNew &&
      (!kind10005data ||
        newKind10005[0]?.event?.created_at > kind10005data?.event?.created_at);

    if (isNewer) {
      const newData = newKind10005[0].event;
      queryClient.setQueryData(querykey, newKind10005[0]); //EventPacketで保存
      return newData;
    } else if (kind10005data) {
      return kind10005data.event;
    }
    return undefined;
  }
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
      tags: $state.snapshot(newTags),
      created_at: Math.floor(Date.now() / 1000),
    };

    try {
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
      const { event: ev, res } = result;
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
      }
    } catch (error) {
      console.error("イベント送信エラー:", error);
      // エラー処理
    } finally {
      $nowProgress = false;
    }
  }
  dialogOpen.subscribe((value) => {
    if (!value) {
      $editChannelListOpen = false;
    }
  });
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
        <span class="text-neutral-500">loading...</span>
      {:else}
        <div class="mt-2 mb-4">
          {#if includeHeyaId}
            <div class="p-3 bg-red-900/20 rounded-lg border border-red-500">
              <!-- 追加または削除しようとしている部屋ID -->
              <ChannelMetadata id={heyaId}>
                {#snippet channelMetadata(event)}
                  {#if event}
                    <ChannelMetadataLayout
                      mini={true}
                      handleClickToChannel={() => {}}
                      id={heyaId}
                      linkButtonTitle={`/channel/${nip19.noteEncode(heyaId)}`}
                      clickAction={false}
                      {event}
                    />
                  {:else}
                    <EmptyListCard
                      handleClickToChannel={() => {}}
                      linkButtonTitle={`/channel/${nip19.noteEncode(heyaId)}`}
                      id={heyaId}
                    >
                      {encodetoNote(heyaId)}
                    </EmptyListCard>
                  {/if}
                {/snippet}
              </ChannelMetadata>

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
              <ChannelMetadata id={heyaId}>
                {#snippet channelMetadata(event)}
                  {#if event}
                    <ChannelMetadataLayout
                      mini={true}
                      handleClickToChannel={() => {}}
                      id={heyaId}
                      linkButtonTitle={`/channel/${nip19.noteEncode(heyaId)}`}
                      clickAction={false}
                      {event}
                    />
                  {:else}
                    <EmptyListCard
                      handleClickToChannel={() => {}}
                      linkButtonTitle={`/channel/${nip19.noteEncode(heyaId)}`}
                      id={heyaId}
                    >
                      {encodetoNote(heyaId)}
                    </EmptyListCard>
                  {/if}
                {/snippet}
              </ChannelMetadata>
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
                <ChannelMetadata {id}>
                  {#snippet channelMetadata(event)}
                    {#if event}
                      <ChannelMetadataLayout
                        mini={true}
                        handleClickToChannel={() => {}}
                        {id}
                        linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
                        clickAction={false}
                        {event}
                      />
                    {:else}
                      <EmptyListCard
                        handleClickToChannel={() => {}}
                        linkButtonTitle={`/channel/${nip19.noteEncode(id)}`}
                        {id}
                      >
                        {encodetoNote(id)}
                      </EmptyListCard>
                    {/if}
                  {/snippet}
                </ChannelMetadata>
              {/each}{/if}
          </div>
        </div>
      {/if}

      <div class="mt-4 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                      bg-zinc-100 px-4 font-medium leading-none text-zinc-600 hover:bg-zinc-200"
        >
          {$_("common.close")}
        </button>
      </div>

      <CloseButton useMelt={$close} ariaLabel="close" />
    </div>
  </div>
{/if}
