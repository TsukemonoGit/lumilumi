<script lang="ts">
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { publishEvent } from "$lib/func/nostr";
  import { emojis, showImg } from "$lib/stores/stores";
  import { SmilePlus } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import split from "graphemesplit";
  export let note: Nostr.Event | undefined;

  // const regexSymbolWithCombiningMarks = /(\P{Mark})(\p{Mark}+)/gu;

  // const countSymbolsIgnoringCombiningMarks = (string: string) => {
  //   const stripped = string.replace(
  //     regexSymbolWithCombiningMarks,
  //     ($0: any, symbol: any, combiningMarks: any) => {
  //       return symbol;
  //     }
  //   );

  //   return punycode.ucs2.decode(stripped).length;
  // };

  export let customReaction: string = "";
  export let emoji: string[] = [];
  export let handleClickOk: any | undefined = undefined;

  let customReactionError: boolean = false;
  let customReactionErrorMessage: string = "";
  let open: boolean;

  const handleClickCustomReaction = () => {
    const textLen = split(customReaction).length; //countSymbolsIgnoringCombiningMarks(customReaction);

    if (textLen !== 1) {
      customReactionError = true;
      customReactionErrorMessage = "Reaction length must be 1";
      setTimeout(() => {
        customReactionError = false;
        customReactionErrorMessage = "";
      }, 3000);
      return;
    }
    if (!note) {
      handleClickOk();
      return;
    }
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: [
        ["p", note.pubkey],
        ["e", note.id],
        ["k", note.kind.toString()],
      ],
      content: customReaction,
    };
    publishEvent(ev);
    open = false;
    customReaction = "";
  };

  const handleClickEmoji = (e: string[]) => {
    emoji = e;
    if (!note) {
      return;
    }

    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: [
        ["p", note.pubkey],
        ["e", note.id],
        ["k", note.kind.toString()],
        ["emoji", ...e],
      ],
      content: `:${e[0]}:`,
    };
    publishEvent(ev);
    open = false;
    customReaction = "";
  };
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleClickCustomReaction();
    }
  }
</script>

<Popover bind:open ariaLabel="Open emoji picker">
  <SmilePlus size="20" class="stroke-magnum-500/75" />
  <div slot="popoverContent">
    <div class="flex gap-1 pr-8 pl-2 max-w-80">
      <input
        type="text"
        class="h-10 w-32 rounded-md px-3 py-2 text-magnum-100 border
             {customReactionError ? 'border-red-500' : 'border-neutral-900'}"
        bind:value={customReaction}
        on:keydown={handleKeyDown}
        aria-label="Enter custom reaction"
      />
      <button
        aria-label="Submit custom reaction"
        on:click={handleClickCustomReaction}
        class="flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
      >
        OK
      </button>
    </div>
    {#if $emojis && $emojis.length > 0}
      <div
        class="border border-magnum-600 flex flex-wrap max-w-80 max-h-80 overflow-y-auto"
      >
        {#each $emojis as e, index}
          {#if customReaction === "" || e[0]
              .toLowerCase()
              .includes(customReaction.toLowerCase())}
            <button
              aria-label={`Select emoji ${e[0]}`}
              on:click={() => handleClickEmoji(e)}
              class="rounded-md border m-0.5 p-2 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
            >
              {#if $showImg}
                <img
                  loading="lazy"
                  class="h-4 object-contain justify-self-center"
                  src={e[1]}
                  alt={e[0]}
                  title={e[0]}
                />{:else}{e[0]}{/if}
            </button>
          {/if}
        {/each}
      </div>
    {/if}
    {#if customReactionError}
      <div class="text-red-500 text-sm mt-1">
        {customReactionErrorMessage}
      </div>
    {/if}
  </div>
</Popover>
