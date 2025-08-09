<!--カスタム絵文字展開付きのName-->
<script lang="ts">
  import {
    parseContent,
    TokenType,
    type Token,
  } from "@konemono/nostr-content-parser";
  import CustomEmoji from "../content/CustomEmoji.svelte";

  interface Props {
    tags: string[][];
    name: string;
    height: number;
  }

  let { tags, name, height }: Props = $props();

  let emojiTags = $derived(
    tags.filter((tag) => tag[0] === "emoji" && tag.length > 2)
  );

  let parts: Token[] | undefined = $derived(
    emojiTags.length >= 0 ? parseContent(name, emojiTags) : undefined
  );
</script>

<span
  class=" line-clamp-1 truncate max-w-full overflow-hidden"
  style="white-space: normal; word-break: break-word; overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;"
  >{#if !parts}{name}{:else}{#each parts as part}{#if part.type === TokenType.CUSTOM_EMOJI}<CustomEmoji
          {part}
          {height}
        />{:else}{part.content}{/if}
    {/each}
  {/if}
</span>
