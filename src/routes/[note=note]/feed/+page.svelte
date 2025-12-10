<script lang="ts">
    import { page } from "$app/stores";
    import { onDestroy, onMount } from "svelte";
    import { derived, get, writable } from "svelte/store";
    import { app } from "$lib/stores/stores";
    import { createRxBackwardReq, uniq, type EventPacket } from "rx-nostr";
    import * as Nostr from "nostr-typedef";
    import * as nip19 from "nostr-tools/nip19";
    import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
    import { useContacts } from "$lib/stores/useContacts";
    import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
    import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
    import { pubkeysIn } from "$lib/func/nostr";
    import { createNeighborFeed } from "$lib/stores/useNeighborFeed.svelte";

    // State
    let id: string = $state("");
    let relays: string[] = $state([]);
    let targetEvent: Nostr.Event | undefined = $state(undefined);
    let contactsEvent: Nostr.Event | undefined = $state(undefined);

    // Feed Logic
    let feed: ReturnType<typeof createNeighborFeed> | undefined =
        $state(undefined);

    // Parse ID
    $effect(() => {
        const noteParam = $page.params.note;
        if (noteParam) {
            try {
                const { type, data } = nip19.decode(noteParam);
                if (type === "note") {
                    id = data;
                } else if (type === "nevent") {
                    id = data.id;
                    if (data.relays) relays = data.relays;
                }
            } catch (e) {
                console.error(e);
            }
        }
    });

    let layoutData: any = $derived($page.data);

    // Fetch Target Event
    $effect(() => {
        if (layoutData?.event) {
            targetEvent = layoutData.event;
        } else if (id && !targetEvent) {
            const rxNostr = get(app).rxNostr;
            const req = createRxBackwardReq("target-note");
            rxNostr
                .use(req)
                .pipe(uniq())
                .subscribe((packet) => {
                    targetEvent = packet.event;
                });
            req.emit({ ids: [id] });
        }
    });

    // Fetch Contacts
    $effect(() => {
        if (targetEvent && !contactsEvent) {
            const rxNostr = get(app).rxNostr;
            const result = useContacts(
                rxNostr,
                ["contacts", targetEvent.pubkey],
                targetEvent.pubkey,
            );
            const unsub = result.data.subscribe((packet) => {
                if (packet?.event) {
                    contactsEvent = packet.event;
                }
            });
            return () => unsub();
        }
    });

    // Initialize Feed
    $effect(() => {
        if (contactsEvent && targetEvent && !feed) {
            const map = pubkeysIn(contactsEvent);
            const authors = Array.from(map.keys());
            if (!authors.includes(targetEvent.pubkey)) {
                authors.push(targetEvent.pubkey);
            }

            feed = createNeighborFeed(get(app).rxNostr, targetEvent, authors);

            // Initial load
            feed.loadOlder();
            feed.loadNewer();
        }
    });
</script>

<div class="container mx-auto max-w-2xl px-4 py-8">
    {#if feed}
        <!-- Newer Button -->
        <div class="flex justify-center mb-4">
            <button
                class="bg-magnum-600 hover:bg-magnum-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                onclick={feed.loadNewer}
                disabled={feed.isLoadingNewer}
            >
                {#if feed.isLoadingNewer}
                    Loading...
                {:else}
                    Load Newer (+10m)
                {/if}
            </button>
        </div>

        <!-- Newer Events -->
        <div class="flex flex-col gap-2 mb-4">
            {#each feed.newerEvents as event (event.id)}
                <div class="border-l-4 border-magnum-300 pl-2">
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

    <!-- Target Event (Sticky) -->
    <div
        class="sticky top-0 bottom-0 z-50 my-8 shadow-2xl ring-4 ring-magnum-500 rounded-lg bg-neutral-900 border border-magnum-400"
    >
        {#if targetEvent}
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

        <!-- Older Button -->
        <div class="flex justify-center mt-4">
            <button
                class="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                onclick={feed.loadOlder}
                disabled={feed.isLoadingOlder}
            >
                {#if feed.isLoadingOlder}
                    Loading...
                {:else}
                    Load Older
                {/if}
            </button>
        </div>

        <!--   <div
            class="fixed bottom-4 right-4 bg-magnum-400/80 p-2 rounded text-xs text-white"
        >
            Offset: +{Math.floor(
                ((feed.newestLoaded || 0) - (targetEvent?.created_at || 0)) /
                    60,
            )}m / -{Math.floor(
                ((targetEvent?.created_at || 0) - (feed.oldestLoaded || 0)) /
                    60,
            )}m
        </div> -->
    {/if}
</div>
