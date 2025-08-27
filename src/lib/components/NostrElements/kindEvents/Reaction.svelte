<script lang="ts">
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  import * as Nostr from "nostr-typedef";
  interface Props {
    event: Nostr.Event;
  }

  const { event }: Props = $props();

  export const getEmoji = (
    ev: Nostr.Event
  ): { alt: string; url: string } | undefined => {
    //console.log(ev.tags);
    const emojiName = event.content.match(/^:(.*):$/);
    if (!emojiName || emojiName.length < 2) return undefined;
    const emojiTag = ev.tags.find(
      (item) => item[0] === "emoji" && item[1] === emojiName[1]
    );
    //console.log(emojiTag);
    if (emojiTag) {
      return { alt: emojiTag[1], url: emojiTag[2] };
    } else {
      return undefined;
    }
  };
</script>

{#if event}
  {#if event.content === "+" || event.content === ""}
    🧡
  {:else if event.content === "-"}
    👎️
  {:else if /^:.*:$/.test(event.content)}
    {@const emoji = getEmoji(event)}
    {#if emoji}
      {#if lumiSetting.get().showImg}
        <img
          loading="lazy"
          alt={`:${emoji.alt}:`}
          src={emoji.url}
          height="20"
          class="h-[20px] object-contain overflow-hidden"
        />
      {:else}
        {emoji.alt}
      {/if}{/if}
  {:else}{event.content}{/if}
{/if}
