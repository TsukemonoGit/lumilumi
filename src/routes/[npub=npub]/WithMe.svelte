<script lang="ts">
  import EmptyCardList from "$lib/components/NostrElements/kindEvents/EventCard/EmptyCardList.svelte";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import type Nostr from "nostr-typedef";
  import { RadioGroup } from "melt/builders";

  let { yourPubkey, req, amount } = $props();

  let myPubkey = $derived(lumiSetting.get().pubkey);

  let filters: Nostr.Filter[] | undefined = $derived.by(() => {
    if (myPubkey && yourPubkey) {
      return [
        {
          kinds: [1, 6, 7, 16, 42],
          authors: [myPubkey],
          "#p": [yourPubkey],
        },
        {
          kinds: [1, 6, 7, 16, 42],
          authors: [yourPubkey],
          "#p": [myPubkey],
        },
      ];
    }
  });

  const group = new RadioGroup({
    value: "All",
  });

  const items = [
    { value: "All", label: "All" },
    { value: "From Them", label: "From Them" },
    { value: "From Me", label: "From Me" },
  ];

  function filterEvents(events: Nostr.Event[]) {
    const selected = group.value;
    if (selected === "All" || !selected) return events;
    if (selected === "From Them")
      return events.filter((e) => e.pubkey === yourPubkey);
    if (selected === "From Me")
      return events.filter((e) => e.pubkey === myPubkey);
    return events;
  }
</script>

{#if filters}
  <div class="m-2 flex justify-end">
    <div {...group.root} class="inline-flex rounded-md bg-magnum-900/50 p-0.5">
      {#each items as item}
        {@const itemState = group.getItem(item.value)}
        <button
          {...itemState.attrs}
          class="filter-tab"
          class:active={itemState.checked}
          type="button"
        >
          {item.label}
        </button>
      {/each}
      <input {...group.hiddenInput} />
    </div>
  </div>

  <TimelineList
    queryKey={["user", "withme", yourPubkey, myPubkey]}
    {filters}
    olderFilters={filters}
    {req}
    {amount}
  >
    {#snippet content({ events })}
      {@const filteredEvents = filterEvents(events)}
      {#if filteredEvents && filteredEvents.length > 0}
        {#each filteredEvents as event (event.id)}
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
            {#snippet loading()}
              <div>
                <EventCard note={event} />
              </div>
            {/snippet}
            {#snippet nodata()}
              <div>
                <EventCard note={event} />
              </div>
            {/snippet}
            {#snippet error()}
              <div>
                <EventCard note={event} />
              </div>
            {/snippet}
            {#snippet content({ metadata })}
              <EventCard {metadata} note={event} />
            {/snippet}
          </Metadata>
        {/each}
      {:else}
        <div class="empty-state">
          <p class="text-magnum-400">No interactions yet</p>
        </div>
      {/if}
    {/snippet}
    {#snippet loading()}
      <EmptyCardList length={10} />
    {/snippet}
    {#snippet error(error)}
      <div class="p-4 text-center text-red-400">
        <p>{error}</p>
      </div>
    {/snippet}
  </TimelineList>
{/if}

<style lang="postcss">
  .filter-tab {
    @apply px-3 py-1 text-xs text-magnum-400 transition-colors;
    @apply hover:text-magnum-200;
  }

  .filter-tab.active {
    @apply rounded bg-magnum-800 text-magnum-200;
  }

  .empty-state {
    @apply mt-8 py-8 text-center text-sm text-magnum-500;
  }
</style>
