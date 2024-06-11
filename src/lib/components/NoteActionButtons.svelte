<script lang="ts">
  import { createPopover, createSync, melt } from "@melt-ui/svelte";
  import { Repeat, Heart, MessageSquare, Ellipsis, X } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { fade } from "svelte/transition";
  import Popover from "./Elements/Popover.svelte";
  import DropdownMenu from "./Elements/DropdownMenu.svelte";
  import Dialog from "./Elements/Dialog.svelte";
  import { getRelaysById } from "$lib/func/nostr";

  export let note: Nostr.Event;
  export let openReplyWindow: boolean = false;

  let dialogOpen: any;
  const menuTexts = ["View Json", "test"];
  const handleSelectItem = (index: number) => {
    console.log(menuTexts[index]);
    if (index === 0) {
      $dialogOpen = true;
    }
  };
</script>

<div>
  <div class="flex justify-around">
    {#if note.kind === 1}
      <button on:click={() => (openReplyWindow = !openReplyWindow)}>
        {#if openReplyWindow}
          <MessageSquare
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500 fill-magnum-700"
          />
        {:else}
          <MessageSquare
            size="20"
            class="hover:opacity-75 active:opacity-50 text-magnum-500 "
          />
        {/if}
      </button>

      <Popover {note}>
        <Repeat size="20" />
      </Popover>
      <Popover {note}>
        <Heart size="20" />
      </Popover>
    {:else}
      <div />
      <div />
      <div />
    {/if}
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
