<script lang="ts">
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import { createRxForwardReq, type DefaultRelayConfig } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import SetDefaultRelays from "./SetDefaultRelays.svelte";
  import { app } from "$lib/stores/stores";
  import Contacts from "./NostrData/Contacts.svelte";
  import UniqueEventList from "./NostrData/UniqueEventList.svelte";
  import { onMount } from "svelte";
  import Metadata from "./NostrData/Metadata.svelte";
  import EventCard from "./EventCard.svelte";

  const relays = ["wss://relay.damus.io", "wss://relay-jp.nostr.wirednet.jp"];
  const pubkey =
    "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5";
  // const STORAGE_KEY = "relaySettings";
  // let localRelays: DefaultRelayConfig[];
  // onMount(() => {
  //   const savedSettings = localStorage.getItem(STORAGE_KEY);
  //   console.log(savedSettings);
  //   if (savedSettings) {
  //     const { relays: savedRelays, useRelaySet: savedRelaySet } =
  //       JSON.parse(savedSettings);
  //     if (savedRelaySet === "1") {
  //       //0が10002か3、１がlocal
  //       localRelays = savedRelays;
  //     }
  //   }
  // });

  const req = createRxForwardReq();

  const targetEventIdOf = (reaction: Nostr.Event) => {
    // Extract the last 'e' tag in .tags (NIP-25)
    return reaction.tags.filter(([tag]) => tag === "e").slice(-1)[0][1];
  };
  const maxSize = 50;
  const pubkeysIn = (contacts: Nostr.Event) => {
    return contacts.tags.reduce((acc, [tag, value]) => {
      if (tag === "p") {
        return [...acc, value];
      } else {
        return acc;
      }
    }, []);
  };

  const sorted = (events: Nostr.Event[]) => {
    // Use a Map to store events by their id to ensure uniqueness
    const uniqueEventsMap = new Map<string, Nostr.Event>();

    events.forEach((event) => {
      uniqueEventsMap.set(event.id, event);
    });

    // Convert the map values back to an array and sort by created_at
    const sortedEvents = [...uniqueEventsMap.values()].sort(
      (a, b) => b.created_at - a.created_at
    );
    return sortedEvents.slice(0, maxSize);
  };

  $: content = $app?.rxNostr
    ? JSON.stringify($app?.rxNostr.getDefaultRelays())
    : "";
</script>

<svelte:head>
  <title>timeline | nosvelte</title>
</svelte:head>

<h1 class="text-5xl text-orange-600">timeline</h1>
<div>defaultrelays</div>
<div>{content}</div>
relays
<SetDefaultRelays {pubkey} let:relays let:status>
  {status}

  <div slot="loading">loading</div>
  <div slot="error">error</div>
  <div slot="nodata">nodata</div>
  <div class="container break-all break-words overflow-x-hidden">
    {#each relays as relay, index}
      {index} {JSON.stringify(relay)}
    {/each}

    contacts

    <Contacts
      queryKey={["timeline", "contacts", pubkey]}
      {pubkey}
      {relays}
      let:contacts
      let:status
      >{status}
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <!-- <div>
        {JSON.stringify(contacts)}
      </div> -->

      <UniqueEventList
        queryKey={["timeline", "feed", pubkey]}
        filters={[
          {
            authors: pubkeysIn(contacts),
            kinds: [1, 6],
            limit: 10,
          },
        ]}
        {req}
        let:events
      >
        <div slot="loading">
          <p>Loading...</p>
        </div>

        <div slot="error" let:error>
          <p>{error}</p>
        </div>

        <div
          class="max-w-[100vw] break-all break-words box-border overflow-x-clip"
        >
          {#each sorted(events) as event (event.id)}<div
              class="max-w-[100vw] break-all break-words whitespace-pre-line m-1 box-border overflow-x-clip"
            >
              <Metadata
                queryKey={["metadata", event.pubkey]}
                pubkey={event.pubkey}
                let:metadata
              >
                <div slot="loading">
                  <EventCard note={event} status="loading" />
                </div>
                <div slot="nodata">
                  <EventCard note={event} status="nodata" />
                </div>
                <div slot="error">
                  <EventCard note={event} status="error" />
                </div>
                <EventCard {metadata} note={event} /></Metadata
              >
            </div>{/each}
        </div>
      </UniqueEventList>
    </Contacts>
  </div>
</SetDefaultRelays>
