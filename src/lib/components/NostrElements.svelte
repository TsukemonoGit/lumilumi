<script lang="ts">
  /**
   * @license Apache-2.0
   * @copyright 2023 Akiomi Kamakura
   */

  import { createRxForwardReq, type DefaultRelayConfig } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import SetDefaultRelays from "./NostrMainData/SetDefaultRelays.svelte";
  import { app } from "$lib/stores/stores";
  import Contacts from "./NostrMainData/Contacts.svelte";
  import UniqueEventList from "./NostrMainData/UniqueEventList.svelte";

  import Metadata from "./NostrMainData/Metadata.svelte";
  import EventCard from "./EventCard.svelte";
  import NostrMain from "./NostrMain.svelte";
  import { setFollowingList } from "$lib/func/nostr";
  import Reactions from "./NostrMainData/Reactions.svelte";

  const maxSize = 100;
  const pubkeysIn = (contacts: Nostr.Event) => {
    const followingList = contacts.tags.reduce((acc, [tag, value]) => {
      if (tag === "p") {
        return [...acc, value];
      } else {
        return acc;
      }
    }, []);
    setFollowingList(followingList);
    return followingList;
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
<div class="break-all">{content}</div>
relays
<NostrMain let:pubkey let:localRelays>
  <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
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
        let:contacts
        let:status
        >{status}
        <div slot="loading">loading</div>
        <div slot="error">error</div>
        <div slot="nodata">nodata</div>

        <UniqueEventList
          queryKey={["timeline", "feed", pubkey]}
          filters={[
            {
              authors: pubkeysIn(contacts),
              kinds: [1, 6, 16],
              limit: 50,
            },
            {
              kinds: [
                1 /*リプライ*/, 6 /*kind1のリポスト*/,
                /*16,kind1以外のリポスト（ktag）*/ 7 /*リアクション kタグ*/,
              ],
              "#p": [pubkey],
              limit: 5,
            },
          ]}
          req={createRxForwardReq()}
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
        <Reactions
          queryKey={["reaction"]}
          filters={[
            {
              kinds: [7],
              authors: [pubkey],
              limit: 5,
            },
          ]}
          req={createRxForwardReq()}
        />
      </Contacts>
    </div>
  </SetDefaultRelays>
</NostrMain>
