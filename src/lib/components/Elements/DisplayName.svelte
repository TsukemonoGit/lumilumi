<script lang="ts">
  import { parseEmojiText } from "$lib/func/displayname";
  import CustomEmoji from "../NostrElements/Note/content/CustomEmoji.svelte";

  export let tags: string[][];
  export let name: string;
  export let height: number;

  $: emojiTags = tags.filter((tag) => tag[0] === "emoji" && tag.length > 2);

  $: parts =
    emojiTags.length >= 0 ? parseEmojiText(name, emojiTags) : undefined;
</script>

{#if !parts}{name}{:else}{#each parts as part}{#if part.type === "emoji"}<CustomEmoji
        {part}
        {height}
      />{:else}<span class="inline align-middle">{part.content}</span>{/if}
  {/each}
{/if}
