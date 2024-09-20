<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Reaction from "../Note/Reaction.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  export let events: Nostr.Event[];
  export let tieKey: string | undefined;
  const filterEventsByContent = (events: Nostr.Event[], content: string) => {
    return events.filter((event) => (event.content || "+") === content);
  };

  $: uniqueContents = [
    ...new Set(events.map((event) => event.content || "+")),
  ].sort(); // Get unique contents and sort them

  const findEvent = (content: string): Nostr.Event => {
    return events.find(
      (event) => (event.content || "+") === content
    ) as Nostr.Event;
  };
</script>

<CollapsibleList title="Reaction" bind:amount={events.length}>
  {#each uniqueContents as content}
    <div
      class="flex max-w-full break-words whitespace-pre-line p-1 box-border overflow-hidden"
    >
      <div class="min-w-6 flex justify-center">
        <Reaction event={findEvent(content)} />
      </div>
      <div class="flex-wrap px-2 gap-1">
        {#each filterEventsByContent(events, content) as event (event.id)}
          {#if event.pubkey}
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
              let:metadata
            >
              <UserMenu
                slot="loading"
                pubkey={event.pubkey}
                metadata={undefined}
                size={24}
                depth={0}
                {tieKey}
              />

              <UserMenu
                slot="error"
                pubkey={event.pubkey}
                metadata={undefined}
                size={24}
                depth={0}
                {tieKey}
              />

              <UserMenu
                slot="nodata"
                pubkey={event.pubkey}
                metadata={undefined}
                size={24}
                depth={0}
                {tieKey}
              />

              <UserMenu
                pubkey={event.pubkey}
                {metadata}
                size={24}
                depth={0}
                {tieKey}
              />
            </Metadata>
          {/if}
        {/each}
      </div>
    </div>
  {/each}
</CollapsibleList>
