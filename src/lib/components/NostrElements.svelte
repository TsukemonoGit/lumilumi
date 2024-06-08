<script lang="ts">
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import { createRxForwardReq, type DefaultRelayConfig } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import SetDefaultRelays from "./SetDefaultRelays.svelte";
  import { app } from "$lib/stores/stores";
  import Contacts from "./Contacts.svelte";
  import UniqueEventList from "./UniqueEventList.svelte";
  import { onMount } from "svelte";
  import Metadata from "./Metadata.svelte";

  const relays = ["wss://relay.damus.io", "wss://relay-jp.nostr.wirednet.jp"];
  const pubkey =
    "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5";
  const STORAGE_KEY = "relaySettings";
  let localRelays: DefaultRelayConfig[];
  onMount(() => {
    const savedSettings = localStorage.getItem(STORAGE_KEY);
    if (savedSettings) {
      const { relays: savedRelays, useRelaySet: savedRelaySet } =
        JSON.parse(savedSettings);
      if (savedRelaySet === "1") {
        //0が10002か3、１がlocal
        localRelays = savedRelays;
      }
    }
  });

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
<SetDefaultRelays relays={localRelays} {pubkey} let:relays let:status>
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
          {#each sorted(events) as event (event.id)}
            <div
              class="max-w-[100vw] break-all break-words whitespace-pre-wrap box-border m-2 overflow-x-clip"
            >
              <Metadata
                queryKey={["metadata", event.pubkey]}
                pubkey={event.pubkey}
                let:metadata
              >
                <div slot="loading">loading {event.pubkey}:{event.content}</div>
                <div slot="nodata">nodata {event.pubkey}:{event.content}</div>
                <div slot="error">error {event.pubkey}:{event.content}</div>
                <section style="border: 1px black solid; padding: 1em;">
                  {#if event.kind === 1}
                    <p>
                      {JSON.parse(metadata.content).name ??
                        "nostrich"}:{event.content}
                    </p>
                  {:else if event.kind === 6}
                    <p>
                      reposted by {JSON.parse(metadata.content).name ??
                        "nostrich"}
                    </p>
                    <!-- <Text
                  queryKey={['timeline', targetEventIdOf(event)]}
                  id={targetEventIdOf(event)}
                  let:text
                >
                  <div slot="nodata">
                    <p>Failed to get note ({targetEventIdOf(event)})</p>
                  </div>

                  <Metadata
                    queryKey={['timeline', 'metadata', text.pubkey]}
                    pubkey={text.pubkey}
                    let:metadata={repostedMetadata}
                  >
                    <div slot="nodata">
                      <p>Failed to get profile (text.pubkey)</p>
                    </div>

                    <p>
                      {JSON.parse(repostedMetadata.content).name ?? 'nostrich'}
                      :
                      {text.content}
                    </p>
                  </Metadata>
                </Text>
              {:else if event.kind === 7}
                <p>
                  {event.content === '+' ? '👍' : event.content}
                  by
                  {JSON.parse(metadata.content).name ?? 'nostrich'}
                </p>
                <Text
                  queryKey={['timeline', targetEventIdOf(event)]}
                  id={targetEventIdOf(event)}
                  let:text
                >
                  <div slot="nodata">
                    <p>Failed to get note ({targetEventIdOf(event)})</p>
                  </div>

                  <Metadata
                    queryKey={['timeline', 'metadata', text.pubkey]}
                    pubkey={text.pubkey}
                    let:metadata={reactedMetadata}
                  >
                    <div slot="nodata">
                      <p>Failed to get profile (text.pubkey)</p>
                    </div>

                    <p>
                      {JSON.parse(reactedMetadata.content).name ?? 'nostrich'}
                      :
                      {text.content}
                    </p>
                  </Metadata>
                </Text> -->
                  {/if}
                </section>
              </Metadata>
            </div>
          {/each}
        </div>
      </UniqueEventList>
    </Contacts>
  </div>
</SetDefaultRelays>
