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

  import { getRelaysById } from "$lib/func/nostr";
  import * as nip19 from "nostr-tools/nip19";

  import type { AdditionalPostOptions } from "$lib/types";

  import EllipsisMenu from "./EllipsisMenu.svelte";
  import CustomReaction from "./CustomReaction.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import Reaction from "../Reaction.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Reactioned from "$lib/components/renderSnippets/nostr/reaction/Reactioned.svelte";
  import {
    nowProgress,
    toastSettings,
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
  import { normalizeURL } from "nostr-tools/utils";

  let {
    note,
    repostable,
    isBookmarked,
    deleted = $bindable(),
  }: {
    note: Nostr.Event;
    repostable: boolean;
    isBookmarked?: boolean;
    deleted: boolean;
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

    //atagでもetagもいれてリアクションするらしい
    tags.push(["p", note.pubkey], ["e", note.id], ["k", note.kind.toString()]);
    if (atag) {
      tags.push(["a", atag]);
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
      $toastSettings = {
        title: "Error",
        description: $_(result.errorCode),
        color: "bg-red-500",
      };
      return;
    }
    // 成功時の処理
    const { event: ev, res } = result;
    const isSuccessRelays: string[] = res
      .filter((item) => item.ok)
      .map((item) => normalizeURL(item.from));

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
    setTimeout(() => {
      debounceUpdate();
    }, 100);
  }
  //リアクションしてないやつだけリアクションしたかどうか監視する感じで
  //リアクションボタン押したあとTLが読み込まれるまで判定できない（？）

  //let replyText: string;

  //https://translate.google.com/?sl=auto&op=translate&text={0}
  //https://www.deepl.com/translator?share=generic#auto/auto/{0}

  let allPtag: string[] = note.tags.reduce((acc, item) => {
    if (item[0] === "p" && !acc.includes(item[1]) && item[1] !== note.pubkey) {
      acc.push(item[1]);
    }
    return acc;
  }, []);

  const menuTexts = [
    { text: `${$_("menu.repost")}`, icon: Repeat2, num: 0 },
    { text: `${$_("menu.quote")}`, icon: Quote, num: 1 },
  ];

  const handleSelectItem = async (index: number) => {
    if (prosessing) return;
    prosessing = true;
    console.log(menuTexts[index].num);
    const relayhints = getRelaysById(note.id).filter((relay) =>
      relay.startsWith("wss://")
    );
    const eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: relayhints,
      author: note.pubkey,
      kind: note.kind,
    };
    const nevent = nip19.neventEncode(eventpointer);
    switch (menuTexts[index].num) {
      case 0:
        //repost
        let tags: string[][] = [
          ["p", note.pubkey],
          [
            "e", //a tagのやつにもeもいれる
            note.id,
            relayhints?.[0] ?? "", //ws://は除く
            "" /*marker*/,
            note.pubkey,
          ],
        ];

        //リポストはetagのことしか書いてない
        //https://github.com/nostr-protocol/nips/blob/master/18.md
        // atag etag 両方いれることにする(リアクションと同じに)

        //replaceable

        if (atag) {
          tags.push(["a", atag, relayhints?.[0] ?? ""]);
        }
        if (note.kind !== 1) {
          tags.push(["k", note.kind.toString()]);
        }
        if (lumiSetting.get().addClientTag) {
          tags.push(clientTag);
        }
        const ev: Nostr.EventParameters =
          note.kind === 1
            ? {
                kind: 6,
                tags: tags,
                content: "",
              }
            : {
                kind: 16,
                tags: tags,
                content: "",
              };
        await publishAndSetQuery(ev, ["reactions", queryId, "repost"]);

        break;
      case 1:
        //Quote

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
        // replyText = atag
        //   ? ` nostr:${encodeNaddr(atag, nevent)} \n`
        //   : ` nostr:${nevent} \n`;

        // openReplyWindow = false;
        // openQuoteWindow = true;
        // setTimeout(() => {
        //   textareaQuote.selectionEnd = 0;
        //   cursorPosition = 0;
        //   textareaQuote.focus();
        // }, 60);
        break;
    }
    prosessing = false;
  };
  function encodeNaddr(atag: string, relayhints: string[]): string | null {
    const matches = atag.match(nip33Regex);
    if (!matches) {
      return null;
    }
    const naddrAddress: nip19.AddressPointer = {
      kind: Number(matches[1]),
      pubkey: matches[2],
      identifier: matches[3],
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
    const storagezap = localStorage.getItem("zap");
    if (storagezap) {
      zapAmount = Number(storagezap);
    }
    dialogOpen?.(true);
    //zapの量決めるダイアログ出す
    setTimeout(() => {
      amountEle?.focus();
    }, 1);
  };
  // onMount(() => {
  //   const storagezap = localStorage.getItem("zap");

  //   zapAmount = Number(storagezap);
  // });

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
    });
    if (zapInvoice === null) {
      $toastSettings = {
        title: "Error",
        description: "Failed to zap",
        color: "bg-red-500",
      };
      $nowProgress = false;
      dialogOpen?.(false);
      return;
    }
    $nowProgress = false;
    invoice = zapInvoice;
    dialogOpen?.(false);
    invoiceOpen?.(true);

    //ザップウィンドウ閉じる処理ZapInvoiceOpenの方にかいてあったよ
    //開いた時間（過去ザップしたことあったら開いた後すぐ閉じちゃうから）
    // const date = now();
    // unsubscribe = observer.subscribe((result: any) => {
    //   console.log(result);
    //   if (result?.data?.event && result.data.event.created_at >= date) {
    //     invoiceOpen?.(false);
    //     unsubscribe?.();
    //   }
    // });
    //サップの量保存
    localStorage.setItem("zap", zapAmount.toString());
  };

  // $: if (!$invoiceOpen) {
  //   invoice = undefined;
  //   unsubscribe?.();
  // }

  // invoiceOpen.subscribe((value: boolean) => {
  //   if (!value) {
  //     invoice = undefined;
  //     unsubscribe?.();
  //   }
  // });

  const onClickReplyIcon = () => {
    let tags: string[][] = [];
    tags.push(["p", note.pubkey]);
    const relaylist = getRelaysById(note.id);
    const root = note.tags.find(
      (item) =>
        (item[0] === "e" || item[0] === "a") &&
        item.length > 2 &&
        item[3] === "root"
    );
    const hint = relaylist.filter((r) => r.startsWith("wss://")); //ws://は除く
    const addTag = atag
      ? ["a", atag, hint?.[0] ?? ""]
      : ["e", note.id, hint?.[0] ?? ""];

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

  const updateInterval = 2000; // 1秒（ミリ秒）
  let timeoutId: NodeJS.Timeout | undefined = undefined;
  let updating = false;

  function debounceUpdate() {
    if (updating) {
      clearTimeout(timeoutId); // 前のタイマーをクリアして最後の1回だけ実行
    }
    timeoutId = setTimeout(() => {
      updateReactionsData();
      updating = false;
    }, updateInterval); // 連続で実行されるのを防ぐ

    updating = true;
  }
  viewEventIds.subscribe((value) => {
    debounceUpdate();
  });
  $effect(() => {
    if (viewEventIds.get().length > 0 || lumiSetting.get().showAllReactions) {
      //   console.log($state.snapshot(viewEventIds.get.length));
      // console.log(
      //   queryClient.getQueriesData({
      //     queryKey: ["reactions", queryId],
      //   })
      // );//これで立ったら複数クエリーの結果が出るけどqueryObserverでは複数のやつ同時にサブスクライブできない
      untrack(() => {
        debounceUpdate();
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

    hasReactions = hasAnyReaction();
    updating = false;
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

    <EllipsisMenu iconSize={20} {note} bind:deleted {isBookmarked} />
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
              buttonClass={"actionButton"}
              {menuTexts}
              {handleSelectItem}
            >
              <Repeat2 size="22" />
            </DropdownMenu>{/snippet}

          {#snippet content({ event })}
            <DropdownMenu
              buttonClass={"actionButton"}
              {menuTexts}
              {handleSelectItem}
            >
              <Repeat2 size="22" class={event ? "text-magnum-200 " : ""} />
            </DropdownMenu>{/snippet}
        </Reposted>{#if lumiSetting.get().showAllReactions && repost_length > 0}<span
            class="text-sm">{repost_length}</span
          >{/if}
      </div>
    {:else}<button
        aria-label="quote"
        class="actionButton"
        onclick={() => handleSelectItem(1)}
      >
        <Quote size="20" class={"stroke-magnum-500/75"} />
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
