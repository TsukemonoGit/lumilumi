<!-- @migration-task Error while migrating Svelte code: Can't migrate code with afterUpdate. Please migrate by hand. -->
<script lang="ts">
  import {
    Repeat2,
    Heart,
    MessageSquare,
    Quote,
    Zap,
    SquareChevronDown,
    SquareChevronUp,
  } from "@lucide/svelte";
  import * as Nostr from "nostr-typedef";

  import { getRelayById, getRelaysById } from "#lib/func/nostr.ts";
  import { generateReply } from "#lib/func/replyGenerator.ts";
  import * as nip19 from "nostr-tools/nip19";

  import type { AdditionalPostOptions, MenuGroup } from "#lib/types.ts";

  import EllipsisMenu from "./EllipsisMenu.svelte";
  import CustomReaction from "./CustomReaction.svelte";
  import DropdownMenu from "#lib/components/Elements/DropdownMenu.svelte";
  import Reaction from "../Reaction.svelte";
  import Metadata from "#lib/components/renderSnippets/nostr/Metadata.svelte";

  import Reactioned from "#lib/components/renderSnippets/nostr/reaction/Reactioned.svelte";
  import {
    nowProgress,
    postWindowOpen,
    additionalPostOptions,
    queryClient,
  } from "#lib/stores/stores.ts";
  import {
    formatToEventPacket,
    noReactionKind,
    profile,
    sortEventPackets,
  } from "#lib/func/util.ts";

  import AlertDialog from "#lib/components/Elements/AlertDialog.svelte";
  import EventCard from "../EventCard/EventCard.svelte";
  import { onDestroy, untrack } from "svelte";
  import ZapInvoiceWindow from "#lib/components/Elements/ZapInvoiceWindow.svelte";
  import { getZapRelay, makeInvoice } from "#lib/func/zap.ts";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { type EventPacket } from "rx-nostr";

  import RepostList from "../../AllReactionsElement/RepostList.svelte";
  import ReactionList from "../../AllReactionsElement/ReactionList.svelte";
  import ZapList from "../../AllReactionsElement/ZapList.svelte";
  import { nip33Regex } from "#lib/func/regex.ts";
  import { lumiSetting, viewEventIds } from "#lib/stores/globalRunes.svelte.ts";
  import Reposted from "#lib/components/renderSnippets/nostr/reaction/Reposted.svelte";
  import Zapped from "#lib/components/renderSnippets/nostr/reaction/Zapped.svelte";
  import { safePublishEvent } from "#lib/func/publishError.ts";
  import { STORAGE_KEYS } from "#lib/func/localStorageKeys.ts";
  import { addToast } from "#lib/components/Elements/Toast.svelte";
  import { saveLocalStorage } from "#lib/func/storage.ts";
  import { getATag } from "#lib/func/eventAddress.ts";
  import { buildReactionEvent, buildRepostEvent } from "#lib/func/reaction.ts";
  import { getReactionEvents } from "#lib/func/reactions.ts";

  let {
    note,
    repostable,
    isBookmarked,
    deleted = $bindable(),
    zIndex,
  }: {
    note: Nostr.Event;
    repostable: boolean;
    isBookmarked?: boolean;
    deleted: boolean;
    zIndex?: number;
  } = $props();

  let warning = $derived(
    note?.tags.find((item) => item[0] === "content-warning"),
  );

  // リプライ対象外。
  // それ以外の kind は NIP-22（kind 1111）でリプライ可能。
  const nonReplyableKinds = [0, 5, 4, 44];

  let atag = $derived(getATag(note));

  let queryId = $derived(atag ?? note.id);

  let isProcessing = false;

  async function submitReaction(content: string, emojiTag?: string[]) {
    if (isProcessing) return;
    isProcessing = true;
    try {
      const ev = buildReactionEvent(note, {
        atag,
        content,
        emojiTag,
        relayHint: getRelayById(note.id),
        addClientTag: lumiSetting.value.addClientTag,
      });
      //観測失敗することあるから押したやつは押したときに観測しておくことにする
      await publishAndSetQuery(ev, ["reactions", queryId, "reaction"]);
    } finally {
      isProcessing = false;
    }
  }

  const handleClickReaction = () => {
    const defaultReaction = lumiSetting.value.defaultReaction;
    return submitReaction(
      defaultReaction?.content ?? "+",
      defaultReaction?.tag,
    );
  };

  const handleSelectCustomReaction = (content: string, emojiTag?: string[]) =>
    submitReaction(content, emojiTag);

  async function publishAndSetQuery(
    eventParam: Nostr.EventParameters,
    queryKey: QueryKey,
  ) {
    const result = await safePublishEvent($state.snapshot(eventParam));
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
    const isSuccessRelays: string[] = res
      .filter((item) => item.ok)
      .map((item) => item.from);

    queryKey = [...queryKey, ev.pubkey];

    const packet = formatToEventPacket(ev, isSuccessRelays[0]);

    //データセットされてないときだけするにする
    if (isSuccessRelays.length > 0) {
      queryClient.setQueryData(queryKey, (oldData: EventPacket[] = []) => {
        // データの重複を排除し、新しいデータを追加//古いデータがすでにあるならそっちが保持されるようにする。
        const uniqueData = [
          ...oldData.filter((item) => item.event.id !== ev.id),
          packet,
        ];

        // created_at の降順でソート
        return sortEventPackets(uniqueData);
      });

      // console.log(queryClient.getQueryData(queryKey));
    }

    scheduleUpdate();
  }
  //リアクションしてないやつだけリアクションしたかどうか監視する感じで
  //リアクションボタン押したあとTLが読み込まれるまで判定できない（？）

  //let replyText: string;

  //https://translate.google.com/?sl=auto&op=translate&text={0}
  //https://www.deepl.com/translator?share=generic#auto/auto/{0}

  let allPtag: string[] = $derived(
    (note?.tags || []).reduce((acc, item) => {
      if (
        item[0] === "p" &&
        !acc.includes(item[1]) &&
        item[1] !== (note?.pubkey || "")
      ) {
        acc.push(item[1]);
      }
      return acc;
    }, []),
  );

  let menuGroups: MenuGroup[] = $derived([
    {
      // label は不要なので省略
      items: [
        { text: $_("menu.action.repost"), icon: Repeat2, action: "repost" },
        { text: $_("menu.action.quote"), icon: Quote, action: "quote" },
      ],
    },
  ]);

  const handleSelectItem = async (action: string) => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const relayhints = getRelaysById(note.id).filter((relay) =>
        relay.startsWith("wss://"),
      );
      const relayHint = getRelayById(note.id);
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: relayhints,
        author: note?.pubkey || "",
        kind: note.kind,
      };
      const nevent = nip19.neventEncode(eventpointer);

      switch (action) {
        case "repost": {
          const ev = buildRepostEvent(note, {
            atag,
            relayHint,
            addClientTag: lumiSetting.value.addClientTag,
          });
          await publishAndSetQuery(ev, ["reactions", queryId, "repost"]);
          break;
        }

        case "quote": {
          const options: AdditionalPostOptions = {
            tags: [],
            content: atag
              ? ` nostr:${encodeNaddr(atag, relayhints)} \n`
              : ` nostr:${nevent} \n`,
            defaultUsers: [],
            addableUserList: [note?.pubkey || ""],
            warningText: warning ? warning[1] : undefined,
          };
          additionalPostOptions.set(options);
          setTimeout(() => {
            $postWindowOpen = true;
          }, 2);
          break;
        }
      }
    } finally {
      isProcessing = false;
    }
  };
  function encodeNaddr(atag: string, relayhints: string[]): string | null {
    const matches = atag.match(nip33Regex);
    if (!matches || matches.length < 4) {
      return null;
    }

    const [, kindStr, pubkey, identifier] = matches;
    const kind = Number(kindStr);
    if (isNaN(kind)) return null;

    const naddrAddress: nip19.AddressPointer = {
      kind,
      pubkey,
      identifier,
      relays: relayhints,
    };

    try {
      return nip19.naddrEncode(naddrAddress);
    } catch (error) {
      return null;
    }
  }

  let invoice: string | undefined = $state(undefined);

  let dialogOpen = $state(false);
  let zapAmount: number = $state(50);
  let zapComment: string = $state("");
  //svelte-ignore non_reactive_update
  let invoiceOpen: (bool: boolean) => void = () => {};
  let amountEle: HTMLInputElement | undefined = $state(undefined);

  const handleClickZap = () => {
    const storagezap = localStorage.getItem(STORAGE_KEYS.ZAP);
    if (storagezap) {
      zapAmount = Number(storagezap);
    }
    dialogOpen = true;
    //zapの量決めるダイアログ出す
    setTimeout(() => {
      amountEle?.focus();
    }, 1);
  };

  const onClickOK = async (metadata: Nostr.Event) => {
    invoice = undefined;
    console.log(zapAmount);
    console.log(zapComment);
    if (zapAmount <= 0) {
      //toast dasite
      dialogOpen = false;
      return;
    }

    $nowProgress = true;
    const amount = zapAmount * 1000;
    //相手のリレーリストを取得
    const zapRelays = await getZapRelay(metadata.pubkey);

    const zapInvoice = await makeInvoice({
      metadata,
      eventTag: atag ? ["a", atag] : ["e", note.id],
      amount: amount,
      comment: zapComment,
      zapRelays: zapRelays,
      kind: note.kind,
    });
    if (zapInvoice === null) {
      addToast({
        data: {
          title: "Error",
          description: "Failed to zap",
          color: "bg-red-500",
        },
      });
      $nowProgress = false;
      dialogOpen = false;
      return;
    }
    $nowProgress = false;
    invoice = zapInvoice;
    dialogOpen = false;
    invoiceOpen?.(true);

    //サップの量保存
    try {
      saveLocalStorage(STORAGE_KEYS.ZAP, zapAmount.toString());
    } catch (error) {
      console.log("Failed to save zap amount to localStorage.");
    }
  };

  const onClickReplyIcon = () => {
    // kind の抽象化レイヤーにより NIP-10（kind1）/ NIP-28（kind42）/ NIP-22（kind1111）を自動選択する
    const { kind, tags } = generateReply({
      targetEvent: note,
      relayHint: getRelayById(note.id),
    });

    const options: AdditionalPostOptions = {
      kind,
      tags: tags,
      content: "",
      defaultUsers: [note?.pubkey || ""],
      addableUserList: allPtag,
      warningText: warning ? warning[1] : undefined,
    };
    additionalPostOptions.set(options);
    setTimeout(() => {
      if (!$postWindowOpen) {
        // console.log($state.snapshot($additionalPostOptions));
        $postWindowOpen = true; //trueにしたときにadditionalがundefinedにならないように
      }
    }, 2);
  };

  let repost: Nostr.Event[] = $state([]);
  let reaction: Nostr.Event[] = $state([]);
  let zap: Nostr.Event[] = $state([]);
  let hasReactions = $derived(
    repost.length > 0 || reaction.length > 0 || zap.length > 0,
  );

  const updateInterval = 2000; //idが変わってからフィルター変えて取り直してイベント取得するまでのラグ
  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
  let destroyed = false;

  function scheduleUpdate() {
    if (destroyed) return;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (destroyed) return;
      updateReactionsData();
      timeoutId = undefined;
    }, updateInterval);
  }

  const unsubscribeViewEventIds = viewEventIds.subscribe((value) => {
    scheduleUpdate(); // viewEventIdsが変わったら500ms後に実行をスケジュール
  });

  $effect(() => {
    viewAllReactions;
    if (viewEventIds.get().length > 0 || lumiSetting.value.showAllReactions) {
      untrack(() => {
        scheduleUpdate();
      });
    }
  });

  function updateReactionsData() {
    if (destroyed) return;

    repost = getReactionEvents(queryId, "repost");
    reaction = getReactionEvents(queryId, "reaction");
    zap = getReactionEvents(queryId, "zapped");

    timeoutId = undefined;
  }

  //$: console.log(allReactions);
  let viewAllReactions: boolean = $state(false);

  // 表示可否の条件。リポスト / Zap / リプライはリアクション非対応 kind に加えて
  // リアクション系イベント自身（6, 16, 7, 17）も対象外。
  let showReaction = $derived(
    !noReactionKind.includes(note.kind) &&
      note.kind !== 9734 &&
      note.kind !== 9735,
  );
  let showZapRepostReply = $derived(
    showReaction && ![6, 16, 7, 17].includes(note.kind),
  );

  onDestroy(() => {
    destroyed = true;
    unsubscribeViewEventIds();
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  });
</script>

{#snippet repostButton(highlighted: boolean)}
  <DropdownMenu buttonClass="actionButton" {menuGroups} {handleSelectItem}>
    <Repeat2 size="22" class={highlighted ? "text-magnum-200" : ""} />
  </DropdownMenu>
{/snippet}

<div
  class="flex flex-row-reverse justify-between pt-0.5 max-w-full overflow-x-hidden"
>
  <div class="flex gap-0.5 overflow-hidden">
    {#if lumiSetting.value.showAllReactions}
      <button
        disabled={!hasReactions}
        class="actionButton"
        onclick={() => {
          viewAllReactions = !viewAllReactions;
        }}
      >
        {#if !viewAllReactions}
          <SquareChevronDown size="20" />
        {:else}
          <SquareChevronUp size="20" />
        {/if}
      </button>
    {/if}
    <!--メニュー-->

    <EllipsisMenu iconSize={20} {note} bind:deleted {isBookmarked} {zIndex} />
  </div>
  <!---->

  {#if showZapRepostReply}
    <Metadata
      queryKey={["metadata", note?.pubkey || ""]}
      pubkey={note?.pubkey || ""}
      >{#snippet loading()}
        <div class="w-[20px]"></div>
      {/snippet}
      {#snippet nodata()}
        <div class="w-[20px]"></div>
      {/snippet}
      {#snippet error()}
        <div class="w-[20px]"></div>
      {/snippet}
      {#snippet content({ metadata })}
        {@const prof = profile(metadata)}
        <!--lud16がある人のみ⚡️表示lud06もあるよ-->
        <div class="flex items-end">
          <Zapped id={atag ?? note.id}>
            {#snippet loading()}
              <button
                class="actionButton"
                disabled={!prof || (!prof.lud16 && !prof.lud06)}
                onclick={handleClickZap}
                aria-label="zap"
              >
                <Zap size="20" />
              </button>
            {/snippet}
            {#snippet content({ event })}
              {#if event === undefined}
                <button
                  disabled={!prof || (!prof.lud16 && !prof.lud06)}
                  class="actionButton"
                  aria-label="zap"
                  onclick={handleClickZap}
                >
                  <Zap size="20" />
                </button>
              {:else}
                <Zap
                  size="20"
                  class=" fill-magnum-500/75 text-magnum-500  min-w-4 my-auto"
                />
              {/if}
            {/snippet}
          </Zapped><span class="text-sm"
            >{#if lumiSetting.value.showAllReactions && zap.length > 0}{zap.length}{/if}</span
          >
        </div>
        <AlertDialog
          bind:open={dialogOpen}
          onClickOK={() => onClickOK(metadata)}
          title="Zap"
          >{#snippet main()}
            <div class=" text-neutral-200 overflow-y-auto max-h-[60vh]">
              <div class="rounded-md">
                <EventCard
                  {note}
                  {metadata}
                  displayMenu={false}
                  repostable={false}
                />
              </div>
              <div class="mt-4 rounded-md">
                <div class="pt-2 font-bold text-magnum-300 text-lg">amount</div>
                <input
                  bind:this={amountEle}
                  type="number"
                  id="amount"
                  class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500/75"
                  placeholder="amount"
                  bind:value={zapAmount}
                />
                <div class="pt-1 text-magnum-300 font-bold text-lg">
                  comment
                </div>
                <input
                  type="text"
                  id="comment"
                  class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500/75"
                  placeholder="comment"
                  bind:value={zapComment}
                />
              </div>
            </div>
          {/snippet}</AlertDialog
        >
      {/snippet}</Metadata
    >
  {/if}
  <!---->
  {#if showReaction}
    <!--カスタムリアクション-->

    <CustomReaction {zIndex} onSelect={handleSelectCustomReaction} />

    <!--リアクション-->
    <div class="flex max-w-[40%] items-end">
      <Reactioned id={atag ?? note.id}>
        {#snippet content({ event })}
          {#if event === undefined}
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <div
              role="button"
              class="actionButton"
              aria-label="reaction"
              onclick={handleClickReaction}
              onkeydown={(e) => e.key === "Enter" && handleClickReaction()}
            >
              <Heart size="20" class=" mt-auto overflow-hidden" />
            </div>{:else}<div class="overflow-hidden my-auto">
              <Reaction {event} />
            </div>{/if}{/snippet}</Reactioned
      ><span class=" text-sm"
        >{#if lumiSetting.value.showAllReactions && reaction.length > 0}{reaction.length}{/if}</span
      >
    </div>
  {/if}
  <!---->
  {#if showZapRepostReply}
    <!--リポスト-->
    {#if repostable}
      <div class="flex items-end">
        <Reposted id={atag ?? note.id}>
          {#snippet loading()}
            {@render repostButton(false)}
          {/snippet}

          {#snippet content({ event })}
            {@render repostButton(!!event)}
          {/snippet}
        </Reposted>{#if lumiSetting.value.showAllReactions && repost.length > 0}<span
            class="text-sm">{repost.length}</span
          >{/if}
      </div>
    {:else}<button
        aria-label="quote"
        class="actionButton"
        onclick={() => handleSelectItem("quote")}
      >
        <Quote size="20" class="stroke-magnum-500/75" />
      </button>
    {/if}
    <!-- リプライ, kind1,42以外は NIP-22 により kind1111
  kind0（プロフィール）・kind5（削除リクエスト）,DMはリプライ不可、それ以外は NIP-22（kind1111）でリプライ可能 -->

    <button
      aria-label="reply"
      onclick={() => {
        onClickReplyIcon();
      }}
      disabled={nonReplyableKinds.includes(note.kind)}
      class="actionButton"
    >
      <MessageSquare size="20" />
    </button>
  {/if}
</div>

{#if viewAllReactions}
  <!--kind6-->
  {#if repost.length > 0}
    <RepostList events={repost} />
  {/if}

  {#if reaction.length > 0}
    <!--kind7-->
    <ReactionList events={reaction} />
  {/if}

  {#if zap.length > 0}
    <!--zap レシート-->
    <ZapList events={zap} />
  {/if}
{/if}

<ZapInvoiceWindow
  bind:openZapwindow={invoiceOpen}
  {invoice}
  id={atag ?? note.id}
/>
