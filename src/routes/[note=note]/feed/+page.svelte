<script lang="ts">
  import { page } from "$app/state";
  import { get } from "svelte/store";
  import { app } from "$lib/stores/stores";

  import * as Nostr from "nostr-typedef";
  import * as nip19 from "nostr-tools/nip19";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { pubkeysIn } from "$lib/func/nostr";
  import { createNeighborFeed } from "$lib/stores/useNeighborFeed.svelte";
  import UserAvatar from "$lib/components/NostrElements/user/UserAvatar.svelte";
  import { profile } from "$lib/func/util";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";
  import type { Attachment } from "svelte/attachments";

  // State
  let id: string = $state("");
  let relays: string[] = $state([]);
  let targetEvent: Nostr.Event | undefined = $state(undefined);
  let contactsEvent: Nostr.Event | undefined = $state(undefined);
  let feed: ReturnType<typeof createNeighborFeed> | undefined =
    $state(undefined);
  let targetNoteElement: HTMLDivElement;
  let targetPosition: "visible" | "above" | "below" = $state("visible");
  let isNearEdge: "top" | "bottom" | null = $state(null);

  // Parse ID from URL params
  $effect(() => {
    const noteParam = page.params.note;
    if (!noteParam) return;

    try {
      const { type, data } = nip19.decode(noteParam);
      let newId = "";

      if (type === "note") {
        newId = data;
      } else if (type === "nevent") {
        newId = data.id;
        if (data.relays) relays = data.relays;
      }

      if (newId && newId !== id) {
        id = newId;
        targetEvent = undefined;
        contactsEvent = undefined;
        feed = undefined;
      }
    } catch (e) {
      console.error("Failed to decode note param:", e);
    }
  });

  // Intersection Observer for Target Note
  $effect(() => {
    if (!targetNoteElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        targetPosition = entry.isIntersecting
          ? "visible"
          : entry.boundingClientRect.top < 0
            ? "above"
            : "below";
      },
      { threshold: 0 }
    );

    observer.observe(targetNoteElement);
    return () => observer.disconnect();
  });

  // Scroll position monitor for showing load buttons
  $effect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const threshold = window.innerWidth < 768 ? 150 : 300;

      if (scrollTop < threshold) {
        isNearEdge = "top";
      } else if (scrollTop + clientHeight > scrollHeight - threshold) {
        isNearEdge = "bottom";
      } else {
        isNearEdge = null;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  });

  const scrollToTarget = () => {
    targetNoteElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  // Helper function to create feed
  const createFeedWithAuthors = (targetEv: Nostr.Event, authors: string[]) => {
    if (!authors.includes(targetEv.pubkey)) {
      authors.push(targetEv.pubkey);
    }
    const newFeed = createNeighborFeed(get(app).rxNostr, targetEv, authors);
    newFeed.loadOlder();
    newFeed.loadNewer();
    return newFeed;
  };

  const onChangeContacts = (event: Nostr.Event) => {
    contactsEvent = event;
    const map = pubkeysIn(contactsEvent);
    const authors = Array.from(map.keys());
    if (targetEvent) {
      feed = createFeedWithAuthors(targetEvent, authors);
    }
  };

  const onChangeTarget = (event: Nostr.Event) => {
    targetEvent = event;
    // Immediately create feed with just the target's pubkey if contacts haven't loaded yet
    if (!contactsEvent) {
      feed = createFeedWithAuthors(event, []);
    }
  };

  // Update feed when both targetEvent and contactsEvent are available
  $effect(() => {
    if (targetEvent && contactsEvent && !feed) {
      const map = pubkeysIn(contactsEvent);
      const authors = Array.from(map.keys());
      feed = createFeedWithAuthors(targetEvent, authors);
    }
  });

  const myAttachment: Attachment = (element) => {
    //console.log(element.nodeName); // 'DIV'
    const scroller = document.scrollingElement; // body / html

    if (scroller && scroller.scrollTop === 0) {
      scroller.scrollTop = 100;
    }
    return () => {
      console.log("cleaning up");
    };
  };
</script>

{#key id}
  <div class="container mx-auto max-w-2xl px-4 py-8" {@attach myAttachment}>
    {#if feed}
      <!-- Newer Events -->
      <div class="flex flex-col gap-2 mb-4">
        {#each feed.newerEvents as event (event.id)}
          <div class="border-l-4 border-magnum-300 pl-2 anchor-auto">
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              {#snippet content({ metadata })}
                <EventCard note={event} {metadata} />
              {/snippet}
              {#snippet loading()}
                <EventCard note={event} />
              {/snippet}
              {#snippet error()}
                <EventCard note={event} />
              {/snippet}
            </Metadata>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Target Event (Anchor) -->
    <div
      id="target-note"
      bind:this={targetNoteElement}
      class="shadow-2xl ring-4 ring-magnum-500 rounded-lg bg-neutral-900 border border-magnum-400 anchor-auto"
    >
      {#await waitForConnections()}
        <div class="p-4 text-center">Loading Target Note...</div>
      {:then d}
        <Text queryKey={["timeline", id]} {id} onChange={onChangeTarget}>
          {#snippet loading()}
            <div class="p-4 text-center">Loading Target Note...</div>
          {/snippet}
          {#snippet nodata()}
            <div class="p-4 text-center">Failed to get Target Event</div>
          {/snippet}
          {#snippet content({ data: targetEvent })}
            <LatestEvent
              queryKey={["timeline", "contacts", targetEvent.pubkey]}
              filters={[
                {
                  kinds: [3],
                  authors: [targetEvent.pubkey],
                  limit: 1,
                },
              ]}
              onChange={onChangeContacts}
            ></LatestEvent>
            <Metadata
              queryKey={["metadata", targetEvent.pubkey]}
              pubkey={targetEvent.pubkey}
            >
              {#snippet content({ metadata })}
                <EventCard
                  note={targetEvent!}
                  {metadata}
                  thread={true}
                  zIndex={55}
                />
              {/snippet}
              {#snippet loading()}
                <EventCard note={targetEvent!} zIndex={55} />
              {/snippet}
              {#snippet error()}
                <EventCard note={targetEvent!} zIndex={55} />
              {/snippet}
            </Metadata>{/snippet}
        </Text>
      {/await}
    </div>

    <!-- Older Events -->
    {#if feed}
      <div class="flex flex-col gap-2 mt-4 mb-16">
        {#each feed.olderEvents as event (event.id)}
          <div class="border-l-4 border-neutral-600 pl-2 anchor-auto">
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              {#snippet content({ metadata })}
                <EventCard note={event} {metadata} />
              {/snippet}
              {#snippet loading()}
                <EventCard note={event} />
              {/snippet}
              {#snippet error()}
                <EventCard note={event} />
              {/snippet}
            </Metadata>
          </div>
        {/each}
      </div>

      <!-- Load Buttons (visible only near top/bottom) -->
      {#if isNearEdge}
        <div
          class="fixed bottom-24 left-1/2 -translate-x-1/2 anchor-none bg-neutral-900/95 backdrop-blur-sm py-3 px-4 rounded-t-xl shadow-2xl z-20"
        >
          {#if isNearEdge === "top"}
            <button
              class="bg-magnum-600 hover:bg-magnum-500 text-neutral-100 font-semibold py-2.5 px-8 md:py-2.5 md:px-8 sm:py-3 sm:px-10 rounded-lg disabled:opacity-50 transition-all active:scale-95 shadow-md"
              onclick={() => {
                const scroller = document.scrollingElement;
                if (scroller && scroller.scrollTop === 0) {
                  scroller.scrollTop = 1;
                }
                feed?.loadNewer();
              }}
              disabled={feed.isLoadingNewer}
            >
              {feed.isLoadingNewer ? "Loading..." : "↑ Load Newer"}
            </button>
          {:else if isNearEdge === "bottom"}
            <button
              class="bg-neutral-600 hover:bg-neutral-500 text-neutral-100 font-semibold py-2.5 px-8 md:py-2.5 md:px-8 sm:py-3 sm:px-10 rounded-lg disabled:opacity-50 transition-all active:scale-95 shadow-md"
              onclick={() => feed?.loadOlder()}
              disabled={feed.isLoadingOlder}
            >
              {feed.isLoadingOlder ? "Loading..." : "↓ Load Older"}
            </button>
          {/if}
        </div>
      {/if}

      <!-- Floating Action Button -->
      {#if targetPosition !== "visible"}
        <div
          class="fixed right-4 flex flex-col gap-2 items-end z-30 anchor-none transition-all duration-300"
          class:bottom-24={isNearEdge === "bottom"}
          class:bottom-16={isNearEdge === "top"}
          class:bottom-12={isNearEdge === null}
        >
          <button
            class="bg-magnum-800 hover:bg-magnum-700 text-neutral-100 pl-1 pr-3 py-1 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer opacity-90 hover:opacity-100"
            onclick={scrollToTarget}
            aria-label="Scroll to target"
          >
            {#if id && targetEvent}
              <Metadata
                queryKey={["metadata", targetEvent.pubkey]}
                pubkey={targetEvent.pubkey}
              >
                {#snippet content({ metadata })}
                  {@const prof = profile(metadata)}
                  <UserAvatar
                    url={prof?.picture}
                    name={prof?.name}
                    pubkey={prof?.pubkey}
                    size={28}
                  />
                {/snippet}
                {#snippet loading()}
                  <UserAvatar
                    size={28}
                    pubkey={targetEvent!.pubkey}
                    url={undefined}
                    name={undefined}
                  />
                {/snippet}
                {#snippet error()}
                  <UserAvatar
                    size={28}
                    pubkey={targetEvent!.pubkey}
                    url={undefined}
                    name={undefined}
                  />
                {/snippet}
              </Metadata>
              <span class="text-sm font-semibold">Main Post</span>
              {#if targetPosition === "above"}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m18 15-6-6-6 6" />
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              {/if}
            {/if}
          </button>
        </div>
      {/if}
    {/if}
  </div>
{/key}
<div class="postWindow">
  <OpenPostWindow options={{ tags: [], kind: 1 }} />
</div>

<style>
  .anchor-auto {
    overflow-anchor: auto;
  }
  .anchor-none {
    overflow-anchor: auto;
  }
</style>
