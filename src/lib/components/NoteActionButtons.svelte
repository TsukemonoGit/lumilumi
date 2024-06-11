<script lang="ts">
  import { createPopover, createSync, melt } from "@melt-ui/svelte";
  import {
    Repeat,
    Heart,
    MessageSquare,
    Ellipsis,
    X,
    SmilePlus,
  } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { fade } from "svelte/transition";
  import Popover from "./Elements/Popover.svelte";
  import DropdownMenu from "./Elements/DropdownMenu.svelte";
  import Dialog from "./Elements/Dialog.svelte";
  import { getRelaysById, publishEvent } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import {
    useHydrate,
    useQueryClient,
    type QueryKey,
  } from "@tanstack/svelte-query";
  import { queryClient } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import { writable } from "svelte/store";

  export let note: Nostr.Event;
  export let openReplyWindow: boolean = false;

  let dialogOpen: any;
  const menuTexts = ["View Json", "Open in njump"];
  const handleSelectItem = (index: number) => {
    console.log(menuTexts[index]);
    if (index === 0) {
      //view json
      $dialogOpen = true;
    }

    if (index === 1) {
      //open in njump
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: getRelaysById(note.id),
        author: note.pubkey,
        kind: note.kind,
      };
      const nevent = nip19.neventEncode(eventpointer);
      const url = `https://njump.me/${nevent}`;

      window.open(url, "_blank", "noreferrer");
    }
  };
  let reaction = writable<string>();

  const handleClickReaction = () => {
    const tmp = "+";
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: [
        ["p", note.pubkey],
        ["e", note.id],
        ["k", note.kind.toString()],
      ],
      content: tmp,
    };
    publishEvent(ev);
  };

  //リアクションしてないやつだけリアクションしたかどうか監視する感じで
  $: if (queryClient && !$reaction) {
    const data = useQueryClient().getQueryData(["reaction", note.id]);

    if (data) {
      const tmp = (data as EventPacket).event.content;
      if (tmp === "+") {
        reaction.set("🧡");
      } else if (tmp === "-") {
        reaction.set("👎️");
      } else {
        reaction.set(tmp);
      }
    }
  }
</script>

<div>
  <div class="flex justify-around">
    {#if note.kind === 1}
      <!--リプライ-->
      <button on:click={() => (openReplyWindow = !openReplyWindow)}>
        <MessageSquare
          size="20"
          class="hover:opacity-75 active:opacity-50 text-magnum-500 {openReplyWindow
            ? 'fill-magnum-700'
            : ''}"
        />
      </button>
      <!--リポスト-->
      <Popover {note}>
        <Repeat size="20" />
      </Popover>
      <!--リアクション-->
      {#if !$reaction}
        <button on:click={handleClickReaction}>
          <Heart
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500"
          />
        </button>
      {:else}
        <div>{$reaction}</div>
      {/if}
      <!--カスタムリアクション-->
      <Popover {note}>
        <SmilePlus size="20" />
      </Popover>
    {/if}
    <!--メニュー-->
    <DropdownMenu {menuTexts} {handleSelectItem}>
      <Ellipsis size="20" />
    </DropdownMenu>
  </div>
  {#if openReplyWindow}
    <div class="w-[100%] p-2">
      <textarea class="w-[100%] rounded-md">{note.pubkey}</textarea>
    </div>
  {/if}
</div>
<Dialog bind:open={dialogOpen}>
  <div slot="main">
    <h2 class="m-0 text-lg font-medium">EVENT JSON</h2>
    <div
      class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[60vh]"
    >
      {JSON.stringify(note, null, 2)}
    </div>
    <h2 class="m-0 text-lg font-medium">Seen on</h2>
    {getRelaysById(note.id)}
  </div></Dialog
>
