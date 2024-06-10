<script lang="ts">
  import * as Nostr from "nostr-typedef";
  export let event: Nostr.Event;

  const getEmoji = (
    ev: Nostr.Event
  ): { alt: string; url: string } | undefined => {
    //console.log(ev.tags);
    const emojiTag = ev.tags.find((item) => item[0] === "emoji");
    //  console.log(emojiTag);
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
        <img alt={emoji.alt} src={emoji.url} height="20" class="h-[20px]" />
      {/if}
    {/await}
  {:else}
    {event.content}
  {/if}
{/if}
