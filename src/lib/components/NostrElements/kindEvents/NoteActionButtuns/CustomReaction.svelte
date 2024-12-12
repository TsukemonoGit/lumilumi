<script lang="ts">
  import Popover from "$lib/components/Elements/Popover.svelte";
  import { emojis } from "$lib/stores/stores";
  import { SmilePlus } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import split from "graphemesplit";
  import { clientTag } from "$lib/func/constants";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    note: Nostr.Event | undefined;
    root: string[] | undefined;
    atag: string | undefined;
    customReaction?: string;
    emoji?: string[];
    handleClickOk?: any | undefined;
    publishAndSetQuery: any;
  }

  let {
    note,
    root,
    atag,
    customReaction = $bindable(""),
    emoji = $bindable([]),
    handleClickOk = undefined,
    publishAndSetQuery,
  }: Props = $props();

  let customReactionError: boolean = $state(false);
  let customReactionErrorMessage: string = $state("");

  // svelte-ignore non_reactive_update
  let openPopover: (bool: boolean) => void = () => {};

  const handleClickCustomReaction = async () => {
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
    if (lumiSetting.get().addClientTag) {
      tags.push(clientTag);
    }
    const ev: Nostr.EventParameters = {
      kind: 7,
      tags: tags,
      content: customReaction,
    };
    await publishAndSetQuery(ev, ["reactions", atag ?? note.id, "reaction"]);
    openPopover?.(false);
    customReaction = "";
  };

  const handleClickEmoji = async (e: string[]) => {
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
    await publishAndSetQuery(ev, ["reactions", atag ?? note.id, "reaction"]);
    openPopover?.(false);
    customReaction = "";
  };
  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleClickCustomReaction();
    }
  }
</script>

<Popover
  bind:openPopover
  buttonClass={"actionButton"}
  ariaLabel="Open emoji picker"
>
  <SmilePlus size="20" class="stroke-magnum-500/75" />

  {#snippet popoverContent()}
    <div>
      <div class="flex gap-1 pr-8 pl-2 max-w-80">
        <input
          type="text"
          class="h-10 w-32 rounded-md px-3 py-2 text-magnum-100 border
               {customReactionError ? 'border-red-500' : 'border-neutral-900'}"
          bind:value={customReaction}
          onkeydown={handleKeyDown}
          aria-label="Enter custom reaction"
        />
        <button
          aria-label="Submit custom reaction"
          onclick={handleClickCustomReaction}
          class="flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        >
          OK
        </button>
      </div>
      {#if $emojis && $emojis.list.length > 0}
        <div
          class="border border-magnum-600 flex flex-wrap max-w-80 max-h-80 overflow-y-auto"
        >
          {#each $emojis.list as e, index}
            {#if customReaction === "" || e[0]
                .toLowerCase()
                .includes(customReaction.toLowerCase())}
              <button
                aria-label={`Select emoji ${e[0]}`}
                onclick={() => handleClickEmoji(e)}
                class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
              >
                {#if lumiSetting.get().showImg}
                  <img
                    loading="lazy"
                    class="h-6 object-contain justify-self-center"
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
  {/snippet}
</Popover>
