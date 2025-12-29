<script lang="ts">
  import { page } from "$app/state";
  import { get } from "svelte/store";
  import { app, defaultRelays } from "$lib/stores/stores";
  import { createRxBackwardReq, uniq } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import * as nip19 from "nostr-tools/nip19";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import { useContacts } from "$lib/stores/useContacts";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { pubkeysIn } from "$lib/func/nostr";
  import { createNeighborFeed } from "$lib/stores/useNeighborFeed.svelte";
  import UserAvatar from "$lib/components/NostrElements/user/UserAvatar.svelte";
  import { profile } from "$lib/func/util";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { waitForConnections } from "$lib/components/renderSnippets/nostr/timelineList";
  import { untrack } from "svelte";
  import { resolve } from "$app/paths";

  // State
  let id: string = $state("");
  let relays: string[] = $state([]);
  let targetEvent: Nostr.Event | undefined = $state(undefined);
  let contactsEvent: Nostr.Event | undefined = $state(undefined);
  let feed: ReturnType<typeof createNeighborFeed> | undefined =
    $state(undefined);
  let targetNoteElement: HTMLDivElement;
  let targetPosition: "visible" | "above" | "below" = $state("visible");

  let layoutData: any = $derived(page.data);

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

  // Fetch Target Event
  $effect(() => {
    if (layoutData?.event) {
      targetEvent = layoutData.event;
      return;
    }

    if (!id || targetEvent) return;

    untrack(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await waitForConnections();
      const rxNostr = get(app).rxNostr;
      //  console.log($defaultRelays); //ここのろぐはでる
      const req = createRxBackwardReq("target-note");
      rxNostr
        .use(req)
        .pipe(uniq())
        .subscribe((packet) => {
          if (packet?.event) {
            console.log(packet.event);
            targetEvent = packet.event;
          }
        });

      req.emit({ ids: [id] });
    });
  });

  // Fetch Contacts
  $effect(() => {
    if (!targetEvent || contactsEvent) return;

    let cleanup: (() => void) | undefined;

    const fetchContacts = async () => {
      const rxNostr = get(app).rxNostr;

      const result = useContacts(
        rxNostr,
        ["contacts", targetEvent!.pubkey],
        targetEvent!.pubkey
      );

      const subscription = result.data.subscribe((packet) => {
        if (packet?.event) {
          contactsEvent = packet.event;
        }
      });

      cleanup = () => subscription();
    };

    fetchContacts();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  });

  // Initialize Feed
  $effect(() => {
    if (!contactsEvent || !targetEvent || feed) return;

    const map = pubkeysIn(contactsEvent);
    const authors = Array.from(map.keys());

    if (!authors.includes(targetEvent.pubkey)) {
      authors.push(targetEvent.pubkey);
    }

    feed = createNeighborFeed(get(app).rxNostr, targetEvent, authors);
    feed.loadOlder();
    feed.loadNewer();
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

  const scrollToTarget = () => {
    targetNoteElement?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };
</script>

<div class="container mx-auto max-w-2xl px-4 py-8">
  {#if feed}
    <!-- Newer Button -->
    <div class="flex justify-center mb-4">
      <button
        class="bg-magnum-600 hover:bg-magnum-500 text-neutral-100 font-bold py-2 px-4 rounded disabled:opacity-50"
        onclick={feed.loadNewer}
        disabled={feed.isLoadingNewer}
      >
        {feed.isLoadingNewer ? "Loading..." : "Load Newer"}
      </button>
    </div>

    <!-- Newer Events -->
    <div class="flex flex-col gap-2 mb-4">
      {#each feed.newerEvents as event (event.id)}
        <div class="border-l-4 border-magnum-300 pl-2">
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
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
    class="shadow-2xl ring-4 ring-magnum-500 rounded-lg bg-neutral-900 border border-magnum-400"
  >
    {#if targetEvent}
      <Metadata
        queryKey={["metadata", targetEvent.pubkey]}
        pubkey={targetEvent.pubkey}
      >
        {#snippet content({ metadata })}
          <EventCard note={targetEvent!} {metadata} thread={true} zIndex={55} />
        {/snippet}
        {#snippet loading()}
          <EventCard note={targetEvent!} zIndex={55} />
        {/snippet}
        {#snippet error()}
          <EventCard note={targetEvent!} zIndex={55} />
        {/snippet}
      </Metadata>
    {:else if id}
      <div class="p-4 text-center">Loading Target Note...</div>
    {/if}
  </div>

  <!-- Older Events -->
  {#if feed}
    <div class="flex flex-col gap-2 mt-4">
      {#each feed.olderEvents as event (event.id)}
        <div class="border-l-4 border-neutral-600 pl-2">
          <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
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

    <!-- Older Button -->
    <div class="flex justify-center mt-4">
      <button
        class="bg-neutral-600 hover:bg-neutral-500 text-neutral-100 font-bold py-2 px-4 rounded disabled:opacity-50"
        onclick={feed.loadOlder}
        disabled={feed.isLoadingOlder}
      >
        {feed.isLoadingOlder ? "Loading..." : "Load Older"}
      </button>
    </div>

    <!-- Floating Action Button -->
    {#if targetPosition !== "visible"}
      <div class="fixed bottom-12 right-4 flex flex-col gap-2 items-end z-10">
        <button
          class="bg-magnum-800 hover:bg-magnum-700 text-neutral-100 pl-1 pr-3 py-1 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer opacity-90 hover:opacity-100"
          onclick={scrollToTarget}
          aria-label="Scroll to target"
        >
          {#if targetEvent}
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

<div class="postWindow">
  <OpenPostWindow options={{ tags: [], kind: 1 }} />
</div>
