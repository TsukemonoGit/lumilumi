<script lang="ts">
  import type { CustomEmojiWithMeta } from "$lib/func/customEmoji";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    part: CustomEmojiWithMeta;
    height?: number;
  }

  let { part, height = 24 }: Props = $props();
  let imgError: boolean = $state(false);
  let imgLoad: boolean = $state(false);
</script>

{#if lumiSetting.get().showImg && !imgError}
  {#if !imgLoad}{part.content}{/if}
  <img
    height={`${height}px`}
    loading="lazy"
    alt={part.content}
    src={part.metadata.url}
    title={part.content}
    class="inline object-contain m-0 overflow-hidden align-bottom"
    style={`height:${height}px`}
    onload={() => {
      imgLoad = true;
    }}
    onerror={() => {
      imgError = true;
    }}
  />
{:else}
  {part.content}
{/if}
