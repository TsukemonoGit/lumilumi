<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  export let event: Nostr.Event;

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
  {#if event.content === "+"}
    🧡
  {:else if event.content === "-"}
    👎️
  {:else if /^:.*:$/.test(event.content)}
    {#await getEmoji(event) then emoji}
      {#if emoji}
        {#if $showImg}
          <img
            loading="lazy"
            alt={emoji.alt}
            src={emoji.url}
            height="20"
            class="h-[20px]"
          />
        {:else}
          {emoji.alt}
        {/if}{/if}
    {/await}
  {:else}
    {event.content}
  {/if}
{/if}
