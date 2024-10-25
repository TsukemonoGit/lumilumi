<script lang="ts">
  import { parseEmojiText } from "$lib/func/displayname";
  import CustomEmoji from "../NostrElements/Note/content/CustomEmoji.svelte";

  export let tags: string[][];
  export let name: string;

  $: emojiTags = tags.filter((tag) => tag[0] === "emoji" && tag.length > 2);
</script>

{#if emojiTags.length <= 0}
  {name}
{:else}
  {@const parts = parseEmojiText(name, emojiTags)}

  {#each parts as part}
    {#if part.type === "emoji"}
      <CustomEmoji {part} />
    {:else}
      {part.content}
    {/if}
  {/each}
{/if}
