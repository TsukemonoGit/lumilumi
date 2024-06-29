<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import PopupProfileIcon from "./PopupProfileIcon.svelte";
  import { decode } from "light-bolt11-decoder";
  import Reaction from "../Note/Reaction.svelte";

  export let events: Nostr.Event[];

  const filterEventsByContent = (events: Nostr.Event[], content: string) => {
    return events.filter((event) => (event.content || "+") === content);
  };

  const uniqueContents = [
    ...new Set(events.map((event) => event.content || "+")),
  ].sort(); // Get unique contents and sort them

  const findEvent = (content: string): Nostr.Event => {
    return events.find(
      (event) => (event.content || "+") === content
    ) as Nostr.Event;
  };
</script>

<div class="border border-magnum-500 rounded-md break-all my-1 w-full">
  <div class="font-bold px-1">
    Reaction {events.length}
  </div>
  {#each uniqueContents as content}
    <div
      class="flex w-full break-words whitespace-pre-line m-1 box-border overflow-hidden event-card"
    >
      <div class="min-w-6 flex justify-center">
        <Reaction event={findEvent(content)} />
      </div>
      <div class="flex-wrap px-2 gap-1">
        {#each filterEventsByContent(events, content) as event (event.id)}
          {#if event.pubkey}
            <PopupProfileIcon pubkey={event.pubkey} />
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</div>
