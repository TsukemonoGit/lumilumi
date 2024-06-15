<script lang="ts">
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { publishEvent } from "$lib/func/nostr";
  import { emojis, showImg } from "$lib/stores/stores";
  import { SmilePlus } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import punycode from "punycode/punycode";

  export let note: Nostr.Event;

  const regexSymbolWithCombiningMarks = /(\P{Mark})(\p{Mark}+)/gu;

  const countSymbolsIgnoringCombiningMarks = (string: string) => {
    const stripped = string.replace(
      regexSymbolWithCombiningMarks,
      ($0: any, symbol: any, combiningMarks: any) => {
        return symbol;
      }
    );

    return punycode.ucs2.decode(stripped).length;
  };

  let customReaction: string = "";
  let customReactionError: boolean = false;
  let customReactionErrorMessage: string = "";
  let open: boolean;
  const handleClickCustomReaction = () => {
    const textLen = countSymbolsIgnoringCombiningMarks(customReaction);

    if (textLen !== 1) {
      customReactionError = true;
      customReactionErrorMessage = "Reaction length must be 1";
      setTimeout(() => {
        customReactionError = false;
        customReactionErrorMessage = "";
      }, 3000);
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
</script>

<Popover bind:open>
  <SmilePlus size="20" />
  <div slot="popoverContent">
    <div class="flex gap-1 pr-8 pl-2">
      <input
        type="text"
        class="h-10 w-32 rounded-md px-3 py-2 text-magnum-100 border
             {customReactionError ? 'border-red-500' : 'border-neutral-900'}"
        bind:value={customReaction}
      />
      <button
        on:click={handleClickCustomReaction}
        class="flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
      >
        OK
      </button>
    </div>
    {#if $emojis && $emojis.length > 0}
      <div
        class="border border-magnum-600 flex flex-wrap max-h-40 overflow-y-auto"
      >
        {#each $emojis as e, index}
          <button
            on:click={() => handleClickEmoji(e)}
            class="rounded-md border ml-2 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
          >
            {#if $showImg}
              <img
                loading="lazy"
                class="h-4 object-contain justify-self-center"
                src={e[1]}
                alt={e[0]}
              />{:else}{e[0]}{/if}
          </button>
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
