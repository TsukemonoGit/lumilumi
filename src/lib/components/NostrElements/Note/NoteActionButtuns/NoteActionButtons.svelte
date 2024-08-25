<script lang="ts">
  import { Repeat2, Heart, MessageSquare, Quote, Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";

  import type { AdditionalPostOptions } from "$lib/types";

  import EllipsisMenu from "./EllipsisMenu.svelte";
  import CustomReaction from "./CustomReaction.svelte";
  import DropdownMenu from "$lib/components/Elements/DropdownMenu.svelte";
  import Reaction from "../Reaction.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import Reposted from "$lib/components/NostrMainData/Reposted.svelte";
  import Reactioned from "$lib/components/NostrMainData/Reactioned.svelte";
  import {
    defaultReaction,
    nowProgress,
    toastSettings,
    postWindowOpen,
    additionalPostOptions,
  } from "$lib/stores/stores";
  import { nip33Regex, profile } from "$lib/func/util";

  import Zapped from "$lib/components/NostrMainData/Zapped.svelte";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import EventCard from "../EventCard.svelte";
  import { afterUpdate, onMount } from "svelte";
  import ZapInvoiceWindow from "$lib/components/Elements/ZapInvoiceWindow.svelte";
  import { makeInvoice } from "$lib/func/makeZap";
  import { _ } from "svelte-i18n";

  export let note: Nostr.Event;
  export let repostable: boolean;
  let dtag: string[] | undefined;
  let atag: string | undefined;

  $: warning = note.tags.find((item) => item[0] === "content-warning");
  $: root = note.tags.find(
    (item) => item[0] === "e" && item.length > 3 && item[3] === "root"
  ) as string[] | undefined;
  let textareaReply: HTMLTextAreaElement;
  let textareaQuote: HTMLTextAreaElement;
  $: {
    if (
      (note.kind >= 10000 && note.kind < 20000) ||
      (note.kind >= 30000 && note.kind < 40000) ||
      note.kind === 0 ||
      note.kind === 3
    ) {
      //atag　で　りぽすと
      dtag = note.tags.find((tag) => tag[0] === "d");
      atag = `${note.kind}:${note.pubkey}:${dtag ? dtag[1] : ""}`;
    } else {
      dtag = undefined;
      atag = undefined;
    }
  }
  // let reaction = writable<string | null>(null);

  const handleClickReaction = () => {
    const tags: string[][] = root ? [root] : [];
    if (atag) {
      tags.push(["p", note.pubkey], ["a", atag], ["k", note.kind.toString()]);
    } else {
      tags.push(
        ["p", note.pubkey],
        ["e", note.id],
        ["k", note.kind.toString()]
      );
    }
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: tags,
      content: $defaultReaction?.content ?? "+",
    };
    if ($defaultReaction?.tag?.length > 0) {
      ev.tags?.push($defaultReaction?.tag);
    }
    publishEvent(ev);
  };

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
    console.log(menuTexts[index].num);
    const eventpointer: nip19.EventPointer = {
      id: note.id,
      relays: getRelaysById(note.id),
      author: note.pubkey,
      kind: note.kind,
    };
    const nevent = nip19.neventEncode(eventpointer);
    switch (menuTexts[index].num) {
      case 0:
        //repost
        let tags: string[][] = [["p", note.pubkey]];
        //replaceable
        if (atag) {
          tags.push(["a", atag]);
        } else {
          tags.push(["e", note.id]);
        }
        if (note.kind !== 1) {
          tags.push(["k", note.kind.toString()]);
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
        publishEvent(ev);

        break;
      case 1:
        //Quote

        const options: AdditionalPostOptions = {
          tags: [],
          content: atag
            ? ` nostr:${encodeNaddr(atag, nevent)} \n`
            : ` nostr:${nevent} \n`,
          defaultUsers: [],
          addableUserList: [note.pubkey],
          warningText: warning ? warning[1] : undefined,
        };
        $additionalPostOptions = options;
        $postWindowOpen = true;
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
  };
  function encodeNaddr(atag: string, nevent: string): string {
    const matches = atag.match(nip33Regex);
    if (!matches) {
      return nevent;
    }
    const naddrAddress: nip19.AddressPointer = {
      kind: Number(matches[1]),
      pubkey: matches[2],
      identifier: matches[3],
    };
    try {
      return nip19.naddrEncode(naddrAddress);
    } catch (error) {
      return nevent;
    }
  }

  // $: if (textareaReply) {
  //   console.log("textareaReply");
  //   textareaReply.focus();
  // }
  let fix: boolean = false;
  afterUpdate(() => {
    //textareaが開いていて、テキストエリアがアクティブの場合真ん中に固定
    if (fix) {
      textareaReply?.focus();
      textareaQuote?.focus();
    }
  });

  let invoice: string | undefined = undefined;
  let dialogOpen: any;
  let zapAmount: number = 50;
  let zapComment: string;
  let invoiceOpen: any;

  const handleClickZap = () => {
    $dialogOpen = true;
    //zapの量決めるダイアログ出す
  };
  onMount(() => {
    const storagezap = localStorage.getItem("zap");

    zapAmount = Number(storagezap);
  });

  const onClickOK = async (metadata: Nostr.Event) => {
    console.log(zapAmount);
    console.log(zapComment);
    if (zapAmount <= 0) {
      //toast dasite
      $dialogOpen = false;
      return;
    }

    $nowProgress = true;
    const amount = zapAmount * 1000;
    const zapInvoice = await makeInvoice({
      metadata,
      id: note.id,
      amount: amount,
      comment: zapComment,
    });
    if (zapInvoice === null) {
      $toastSettings = {
        title: "Error",
        description: "Failed to zap",
        color: "bg-red-500",
      };
      return;
    }
    $nowProgress = false;
    invoice = zapInvoice;
    $dialogOpen = false;
    $invoiceOpen = true;
    //サップの量保存
    const storage = localStorage.setItem("zap", zapAmount.toString());
  };
  $: if (!$invoiceOpen) {
    invoice = undefined;
  }

  const onClickReplyIcon = () => {
    let tags: string[][] = [];
    tags.push(["p", note.pubkey]);

    const root = note.tags.find(
      (item) => item[0] === "e" && item.length > 2 && item[3] === "root"
    );

    if (atag) {
      tags.push(["a", atag, getRelaysById(note.id)?.[0] ?? ""]);
    } else {
      if (root) {
        // if (note.kind !== 42) {
        //パブ茶（42）の場合はそっちの方でrootが付いてるからリプライにもつけたら重複するから外す
        tags.push(root);
        // }
        tags.push(["e", note.id, getRelaysById(note.id)?.[0] ?? "", "reply"]);
      } else {
        tags.push(["e", note.id, getRelaysById(note.id)?.[0] ?? "", "root"]);
      }
    }

    const options: AdditionalPostOptions = {
      kind: note.kind === 42 ? 42 : 1,
      tags: tags,
      content: "",
      defaultUsers: [note.pubkey],
      addableUserList: allPtag,
      warningText: warning ? warning[1] : undefined,
    };
    $additionalPostOptions = options;
    $postWindowOpen = true;
    // openReplyWindow = !openReplyWindow;

    // replyText = "";
    // if (openReplyWindow) {
    //   openQuoteWindow = false;
    //   setTimeout(() => {
    //     textareaReply?.focus();
    //   }, 20);
    // }
  };
</script>

<div
  class="flex justify-between py-0.5 mr-2 max-w-full overflow-x-hidden gap-1"
>
  {#if note.kind !== 6 && note.kind !== 16 && note.kind !== 7 && note.kind !== 17 && note.kind !== 9734 && note.kind !== 9735}
    <!--リプライ-->
    <button
      aria-label="reply"
      on:click={() => {
        onClickReplyIcon();
      }}
    >
      <MessageSquare
        size="20"
        class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden "
      />
    </button>

    <!--リポスト-->
    {#if repostable}
      <Reposted id={note.id} let:event>
        <DropdownMenu slot="loading" {menuTexts} {handleSelectItem}>
          <Repeat2 size="21" />
        </DropdownMenu>

        <DropdownMenu slot="nodata" {menuTexts} {handleSelectItem}>
          <Repeat2 size="21" />
        </DropdownMenu>
        <DropdownMenu slot="error" {menuTexts} {handleSelectItem}>
          <Repeat2 size="21" />
        </DropdownMenu>
        <DropdownMenu {menuTexts} {handleSelectItem}>
          <Repeat2 size="21" class={event ? "text-magnum-200 " : ""} />
        </DropdownMenu>
      </Reposted>
    {:else}<button aria-label="quote" on:click={() => handleSelectItem(1)}>
        <Quote size="20" class={"stroke-magnum-500/75"} />
      </button>
    {/if}
  {/if}

  {#if note.kind !== 9734 && note.kind !== 9735}
    <!--リアクション-->
    <Reactioned id={note.id} let:event>
      <button
        aria-label="reaction"
        slot="loading"
        on:click={handleClickReaction}
      >
        <Heart
          size="20"
          class="hover:opacity-75 active:opacity-50 text-magnum-500/75 mt-auto overflow-hidden"
        />
      </button>

      <button
        aria-label="reaction"
        slot="nodata"
        on:click={handleClickReaction}
      >
        <Heart
          size="20"
          class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
        />
      </button>

      <button aria-label="reaction" slot="error" on:click={handleClickReaction}>
        <Heart
          size="20"
          class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
        />
      </button>

      {#if event === undefined}
        <button aria-label="reaction" on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
          />
        </button>
      {:else}
        <div class="overflow-hidden max-w-[40%]"><Reaction {event} /></div>
      {/if}
    </Reactioned>
    <!--カスタムリアクション-->
    <CustomReaction {note} {root} {atag} />
  {/if}

  {#if note.kind !== 6 && note.kind !== 16 && note.kind !== 7 && note.kind !== 17 && note.kind !== 9734 && note.kind !== 9735}
    <Metadata
      queryKey={["metadata", note.pubkey]}
      pubkey={note.pubkey}
      let:metadata
      ><div slot="loading" class="w-[20px]"></div>
      <div slot="nodata" class="w-[20px]"></div>
      <div slot="error" class="w-[20px]"></div>
      {@const prof = profile(metadata)}
      {#if prof && (prof.lud16 || prof.lud06)}<!--lud16がある人のみ⚡️表示lud06もあるよ-->

        <Zapped id={note.id} let:event>
          <button slot="loading" on:click={handleClickZap} aria-label="zap">
            <Zap
              size="20"
              class="hover:opacity-75 active:opacity-50 text-magnum-500/75 mt-auto overflow-hidden"
            />
          </button>

          <button aria-label="zap" slot="nodata" on:click={handleClickZap}>
            <Zap
              size="20"
              class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
            />
          </button>

          <button aria-label="zap" slot="error" on:click={handleClickZap}>
            <Zap
              size="20"
              class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
            />
          </button>

          {#if event === undefined}
            <button aria-label="zap" on:click={handleClickZap}>
              <Zap
                size="20"
                class="hover:opacity-75 active:opacity-50 text-magnum-500/75 overflow-hidden"
              />
            </button>
          {:else}
            <Zap
              size="20"
              class="text-magnum-500/75 overflow-hidden fill-magnum-500/75"
            />
          {/if}
        </Zapped>
        <AlertDialog
          bind:open={dialogOpen}
          onClickOK={() => onClickOK(metadata)}
          title="Zap"
        >
          <div slot="main" class=" text-neutral-200">
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
                type="number"
                id="amount"
                class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500/75"
                placeholder="amount"
                bind:value={zapAmount}
              />
              <div class="pt-1 text-magnum-300 font-bold text-lg">comment</div>
              <input
                type="text"
                id="comment"
                class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500/75"
                placeholder="comment"
                bind:value={zapComment}
              />
            </div>
          </div></AlertDialog
        >
      {:else}<div class="w-[20px] overflow-hidden" />{/if}</Metadata
    >
  {/if}
  <!--メニュー-->
  <EllipsisMenu {note} />
</div>

<ZapInvoiceWindow bind:open={invoiceOpen} bind:invoice />

<style>
  input[type="text"] {
    background-color: rgb(var(--color-neutral-800) / 1);
  }
  input[type="number"] {
    background-color: rgb(var(--color-neutral-800) / 1);
  }
</style>
