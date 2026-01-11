<script lang="ts">
  import { emojis } from "$lib/stores/stores";
  import { RefreshCw } from "lucide-svelte";
  import split from "graphemesplit";
  import EmojiListUpdate from "$lib/components/SettingsElements/EmojiListUpdate.svelte";
  import { npubRegex } from "$lib/func/regex";
  import { nip19 } from "nostr-tools";
  import { getUserProfile } from "$lib/func/customEmoji";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    onSelect: (emoji: string, emojiTag?: string[]) => void;
    customReaction?: string;
  }

  let { onSelect, customReaction = $bindable("") }: Props = $props();

  let customReactionError: boolean = $state(false);
  let customReactionErrorMessage: string = $state("");

  const handleClickCustomReaction = () => {
    const textLen = split(customReaction).length;

    if (textLen !== 1) {
      customReactionError = true;
      customReactionErrorMessage = "Reaction length must be 1";
      setTimeout(() => {
        customReactionError = false;
        customReactionErrorMessage = "";
      }, 3000);
      return;
    }

    onSelect(customReaction);
    customReaction = "";
  };

  const handleClickEmoji = (e: string[]) => {
    onSelect(`:${e[0]}:`, e);
    customReaction = "";
  };

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      handleClickCustomReaction();
    }
  }

  const getEmojiTag = async (pub: string): Promise<string | null> => {
    try {
      const hex = nip19.decode(pub)?.data as string;
      const profile = await getUserProfile(hex);
      const picture = profile?.picture;
      if (picture) {
        return picture;
      }
      return null;
    } catch (error) {
      console.warn(`Failed to process npub emoji: ${pub}`, error);
    }
    return null;
  };
</script>

<div class="flex gap-1 mr-6">
  <input
    id="emoji"
    type="text"
    class="h-10 w-full rounded-md px-2 py-2 text-magnum-100 border
           {customReactionError ? 'border-red-500' : 'border-neutral-900'}"
    bind:value={customReaction}
    onkeydown={handleKeyDown}
    aria-label="Enter custom reaction"
    placeholder="Enter an emoji🌞"
  />
  <button
    aria-label="Submit custom reaction"
    onclick={handleClickCustomReaction}
    class="h-10 w-20 flex items-center justify-center rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
  >
    OK
  </button>
</div>

<div
  class="rounded-md mt-2 border border-magnum-600 flex flex-wrap max-w-sm max-h-80 overflow-y-auto relative"
>
  {#each $emojis.list as e, index}
    {#if customReaction === "" || e[0]
        .toLowerCase()
        .includes(customReaction.replace(":", "").toLowerCase())}
      <button
        aria-label={`Select emoji ${e[0]}`}
        onclick={() => handleClickEmoji(e)}
        class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
      >
        {#if lumiSetting.get().showImg}
          <img
            height="24px"
            loading="lazy"
            class="h-6 min-w-6 object-contain justify-self-center"
            src={e[1]}
            alt={e[0]}
            title={e[0]}
          />
        {:else}{e[0]}{/if}
      </button>
    {/if}
  {/each}
  {#if npubRegex.test(customReaction)}
    {#await getEmojiTag(customReaction) then url}
      {#if url}
        <button
          aria-label={`Select emoji ${customReaction}`}
          onclick={() => handleClickEmoji([customReaction, url])}
          class="rounded-md border m-0.5 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 text-sm"
        >
          {#if lumiSetting.get().showImg}
            <img
              height="24px"
              loading="lazy"
              class="h-6 min-w-6 object-contain justify-self-center"
              src={url}
              alt={customReaction}
              title={customReaction}
            />
          {:else}{customReaction}{/if}
        </button>
      {/if}
    {/await}
  {/if}

  <EmojiListUpdate
    buttonClass="sticky bottom-1 right-1 p-1  ml-auto h-fit w-fit rounded-full hover:opacity-75 active:opacity-50 text-magnum-600 bg-neutral-900"
  >
    <RefreshCw />
  </EmojiListUpdate>
</div>

{#if customReactionError}
  <div class="text-red-500 text-sm mt-1">
    {customReactionErrorMessage}
  </div>
{/if}
