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
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import { getRelayById, getRelaysById } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";

  import type { AdditionalPostOptions, MenuGroup } from "$lib/types";

  import EllipsisMenu from "./EllipsisMenu.svelte";
  import CustomReaction from "./CustomReaction.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import Reaction from "../Reaction.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Reactioned from "$lib/components/renderSnippets/nostr/reaction/Reactioned.svelte";
  import {
    nowProgress,
    postWindowOpen,
    additionalPostOptions,
    queryClient,
  } from "$lib/stores/stores";
  import {
    formatToEventPacket,
    noReactionKind,
    profile,
    sortEventPackets,
  } from "$lib/func/util";

  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import EventCard from "../EventCard/EventCard.svelte";
  import { untrack } from "svelte";
  import ZapInvoiceWindow from "$lib/components/Elements/ZapInvoiceWindow.svelte";
  import { getZapRelay, makeInvoice } from "$lib/func/zap";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { type QueryKey } from "@tanstack/svelte-query";
  import { type EventPacket } from "rx-nostr";

  import RepostList from "../../AllReactionsElement/RepostList.svelte";
  import ReactionList from "../../AllReactionsElement/ReactionList.svelte";
  import ZapList from "../../AllReactionsElement/ZapList.svelte";
  import { clientTag } from "$lib/func/constants";
  import { nip33Regex } from "$lib/func/regex";
  import { lumiSetting, viewEventIds } from "$lib/stores/globalRunes.svelte";
  import Reposted from "$lib/components/renderSnippets/nostr/reaction/Reposted.svelte";
  import Zapped from "$lib/components/renderSnippets/nostr/reaction/Zapped.svelte";
  import { safePublishEvent } from "$lib/func/publishError";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { addToast } from "$lib/components/Elements/Toast.svelte";

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
    note?.tags.find((item) => item[0] === "content-warning")
  );
  let root = $derived(
    note?.tags.find(
      (item) => item[0] === "e" && item.length > 3 && item[3] === "root"
    ) as string[] | undefined
  );

  let atag: string | undefined = $derived.by(() => {
    if (
      note &&
      ((note.kind >= 10000 && note.kind < 20000) ||
        (note.kind >= 30000 && note.kind < 40000) ||
        note.kind === 0 ||
        note.kind === 3)
    ) {
      //atag　で　りぽすと
      const dtag = note.tags.find((tag) => tag[0] === "d");
      return `${note.kind}:${note.pubkey}:${dtag ? dtag[1] : ""}`;
    } else {
      return undefined;
    }
  });

  let queryId = $derived(atag ?? note?.id);
  let prosessing = false;
  const handleClickReaction = async () => {
    if (prosessing) return;
    prosessing = true;
    //console.log("atag:", atag);
    const tags: string[][] = root ? [root] : [];

    const relayHint = getRelayById(note.id);
    //atagでもetagもいれてリアクションするらしい
    tags.push(
      ["p", note.pubkey],
      ["e", note.id, relayHint, note.pubkey],
      ["k", note.kind.toString()]
    );
    if (atag) {
      tags.push(["a", atag, relayHint]);
    }

    if (lumiSetting.get().addClientTag) {
      tags.push(clientTag);
    }
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: tags,
      content: lumiSetting.get().defaultReaction?.content ?? "+",
    };
    if (lumiSetting.get().defaultReaction?.tag?.length > 0) {
      ev.tags?.push(lumiSetting.get().defaultReaction?.tag);
    }

    //観測失敗することあるから押したやつは押したときに観測しておくことにする

    await publishAndSetQuery(ev, ["reactions", queryId, "reaction"]);
    prosessing = false;
  };

  async function publishAndSetQuery(
    eventParam: Nostr.EventParameters,
    queryKey: QueryKey
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
    note.tags.reduce((acc, item) => {
      if (
        item[0] === "p" &&
        !acc.includes(item[1]) &&
        item[1] !== note.pubkey
      ) {
        acc.push(item[1]);
      }
      return acc;
    }, [])
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
    if (prosessing) return;
    prosessing = true;

    const relayhints = getRelaysById(note.id).filter((relay) =>
      relay.startsWith("wss://")
    );
    const relayHint = getRelayById(note.id);
    const eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: relayhints,
      author: note.pubkey,
      kind: note.kind,
    };
    const nevent = nip19.neventEncode(eventpointer);

    switch (action) {
      case "repost":
        let tags: string[][] = [
          ["p", note.pubkey],
          ["e", note.id, relayHint, note.pubkey],
        ];

        if (atag) tags.push(["a", atag, relayHint]);
        if (note.kind !== 1) tags.push(["k", note.kind.toString()]);
        if (lumiSetting.get().addClientTag) tags.push(clientTag);

        const ev: Nostr.EventParameters =
          note.kind === 1
            ? { kind: 6, tags, content: "" }
            : { kind: 16, tags, content: "" };

        await publishAndSetQuery(ev, ["reactions", queryId, "repost"]);
        break;

      case "quote":
        const options: AdditionalPostOptions = {
          tags: [],
          content: atag
            ? ` nostr:${encodeNaddr(atag, relayhints)} \n`
            : ` nostr:${nevent} \n`,
          defaultUsers: [],
          addableUserList: [note.pubkey],
          warningText: warning ? warning[1] : undefined,
        };
        additionalPostOptions.set(options);
        setTimeout(() => {
          $postWindowOpen = true;
        }, 2);
        break;
    }

    prosessing = false;
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

  //svelte-ignore non_reactive_update
  let dialogOpen: (bool: boolean) => void = () => {};
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
    dialogOpen?.(true);
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
      dialogOpen?.(false);
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
      dialogOpen?.(false);
      return;
    }
    $nowProgress = false;
    invoice = zapInvoice;
    dialogOpen?.(false);
    invoiceOpen?.(true);

    //サップの量保存
    try {
      localStorage.setItem(STORAGE_KEYS.ZAP, zapAmount.toString());
    } catch (error) {
      console.log("Failed to save zap amount to localStorage.");
    }
  };

  const onClickReplyIcon = () => {
    let tags: string[][] = [];
    tags.push(["p", note.pubkey]);
    const relaylist = getRelayById(note.id);
    const root = note.tags.find(
      (item) =>
        (item[0] === "e" || item[0] === "a") &&
        item.length > 2 &&
        item[3] === "root"
    );

    const addTag = atag ? ["a", atag, relaylist] : ["e", note.id, relaylist];

    if (root) {
      // if (note.kind !== 42) {
      //パブ茶（42）の場合はそっちの方でrootが付いてるからリプライにもつけたら重複するから外す
      tags.push(root);
      // }
      tags.push([...addTag, "reply"]);
    } else {
      tags.push([...addTag, "root"]);
    }

    const options: AdditionalPostOptions = {
      kind: note.kind === 42 ? 42 : 1,
      tags: tags,
      content: "",
      defaultUsers: [note.pubkey],
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
  let repost_length: number = $derived(repost.length);

  let reaction_length: number = $derived(reaction.length);

  let zap_length: number = $derived(zap.length);
  let hasReactions: boolean = $state(false);

  const updateInterval = 2000; //idが変わってからフィルター変えて取り直してイベント取得するまでのラグ
  let timeoutId: NodeJS.Timeout | undefined = undefined;

  function scheduleUpdate() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      updateReactionsData();
      timeoutId = undefined;
    }, updateInterval);
  }

  viewEventIds.subscribe((value) => {
    scheduleUpdate(); // viewEventIdsが変わったら500ms後に実行をスケジュール
  });

  $effect(() => {
    viewAllReactions;
    if (viewEventIds.get().length > 0 || lumiSetting.get().showAllReactions) {
      untrack(() => {
        scheduleUpdate();
      });
    }
  });

  function updateReactionsData() {
    repost = queryClient
      .getQueriesData({
        queryKey: ["reactions", queryId, "repost"],
      })
      .filter(
        ([key, value]) =>
          Array.isArray(value) &&
          value.every((item) => (item as EventPacket).event)
      ) // EventPacket[]をチェック
      .map(([key, value]) => value as EventPacket[]) // 型を EventPacket[] に変換
      .flatMap((value: EventPacket[]) => value.map((item) => item.event)); // 配列からeventを取り出す

    reaction = queryClient
      .getQueriesData({
        queryKey: ["reactions", queryId, "reaction"],
      })
      .filter(
        ([key, value]) =>
          Array.isArray(value) &&
          value.every((item) => (item as EventPacket).event)
      ) // EventPacket[]をチェック
      .map(([key, value]) => value as EventPacket[]) // 型を EventPacket[] に変換
      .flatMap((value: EventPacket[]) => value.map((item) => item.event)); // 配列からeventを取り出す

    zap = queryClient
      .getQueriesData({
        queryKey: ["reactions", queryId, "zapped"],
      })
      .filter(
        ([key, value]) =>
          Array.isArray(value) &&
          value.every((item) => (item as EventPacket).event)
      ) // EventPacket[]をチェック
      .map(([key, value]) => value as EventPacket[]) // 型を EventPacket[] に変換
      .flatMap((value: EventPacket[]) => value.map((item) => item.event)); // 配列からeventを取り出す
    /*    console.log("Updated:", {
      repost: repost.length,
      reaction: reaction.length,
    }); */
    hasReactions = hasAnyReaction();
    timeoutId = undefined;
  }

  function hasAnyReaction(): boolean {
    return repost_length > 0 || reaction_length > 0 || zap_length > 0;
  }
  //$: console.log(allReactions);
  let viewAllReactions: boolean = $state(false);
</script>

<div
  class="flex flex-row-reverse justify-between pt-0.5 max-w-full overflow-x-hidden"
>
  <div class="flex gap-0.5 overflow-hidden">
    {#if lumiSetting.get().showAllReactions}
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

  {#if note.kind !== 6 && note.kind !== 16 && note.kind !== 7 && note.kind !== 17 && note.kind !== 9734 && note.kind !== 9735 && !noReactionKind.includes(note.kind)}
    <Metadata queryKey={["metadata", note.pubkey]} pubkey={note.pubkey}
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
            >{#if lumiSetting.get().showAllReactions && zap_length > 0}{zap_length}{/if}</span
          >
        </div>
        <AlertDialog
          bind:openDialog={dialogOpen}
          onClickOK={() => onClickOK(metadata)}
          title="Zap"
          >{#snippet main()}
            <div class=" text-neutral-200">
              <div class="rounded-md">
                <EventCard
                  maxHeight={192}
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
  {#if note.kind !== 9734 && note.kind !== 9735 && !noReactionKind.includes(note.kind)}
    <!--カスタムリアクション-->

    <CustomReaction {note} {root} {atag} {publishAndSetQuery} />

    <!--リアクション-->
    <div class="flex max-w-[40%] items-end">
      <Reactioned id={atag ?? note.id}>
        {#snippet loading()}
          <button
            class="actionButton"
            aria-label="reaction"
            onclick={handleClickReaction}
          >
            <Heart size="20" class=" mt-auto overflow-hidden" />
          </button>
        {/snippet}

        {#snippet content({ event })}
          {#if event === undefined}
            <button
              class="actionButton"
              aria-label="reaction"
              onclick={handleClickReaction}
            >
              <Heart size="20" class=" mt-auto overflow-hidden" />
            </button>{:else}<div class="overflow-hidden my-auto">
              <Reaction {event} />
            </div>{/if}{/snippet}</Reactioned
      ><span class=" text-sm"
        >{#if lumiSetting.get().showAllReactions && reaction_length > 0}{reaction_length}{/if}</span
      >
    </div>
  {/if}
  <!---->
  {#if note.kind !== 6 && note.kind !== 16 && note.kind !== 7 && note.kind !== 17 && note.kind !== 9734 && note.kind !== 9735 && !noReactionKind.includes(note.kind)}
    <!--リポスト-->
    {#if repostable && !noReactionKind.includes(note.kind)}
      <div class="flex items-end">
        <Reposted id={atag ?? note.id}>
          {#snippet loading()}
            <DropdownMenu
              buttonClass="actionButton"
              {menuGroups}
              {handleSelectItem}
            >
              <Repeat2 size="22" />
            </DropdownMenu>
          {/snippet}

          {#snippet content({ event })}
            <DropdownMenu
              buttonClass="actionButton"
              {menuGroups}
              {handleSelectItem}
            >
              <Repeat2 size="22" class={event ? "text-magnum-200" : ""} />
            </DropdownMenu>
          {/snippet}
        </Reposted>{#if lumiSetting.get().showAllReactions && repost_length > 0}<span
            class="text-sm">{repost_length}</span
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
    <!--リプライ, kind1,42以外は NIP-22 により kind1111 -->
    <!--とりあえず1,42以外消す-->

    <button
      aria-label="reply"
      onclick={() => {
        onClickReplyIcon();
      }}
      disabled={note.kind !== 1 && note.kind !== 42}
      class="actionButton"
    >
      <MessageSquare size="20" />
    </button>
  {/if}
</div>

{#if viewAllReactions}
  <!--kind6-->
  {#if repost_length > 0}
    <RepostList events={repost} />
  {/if}

  {#if reaction_length > 0}
    <!--kind7-->
    <ReactionList events={reaction} />
  {/if}

  {#if zap_length > 0}
    <!--zap レシート-->
    <ZapList events={zap} />
  {/if}
{/if}

<ZapInvoiceWindow
  bind:openZapwindow={invoiceOpen}
  {invoice}
  id={atag ?? note.id}
/>

<style lang="postcss">
  input[type="text"] {
    background-color: rgb(var(--color-neutral-800) / 1);
  }
  input[type="number"] {
    background-color: rgb(var(--color-neutral-800) / 1);
  }
</style>
