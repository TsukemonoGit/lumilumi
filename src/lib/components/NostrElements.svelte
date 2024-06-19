<script lang="ts">
  import { createRxForwardReq, createRxNostr } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import SetDefaultRelays from "./NostrMainData/SetDefaultRelays.svelte";
  import Contacts from "./NostrMainData/Contacts.svelte";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import EventCard from "./Note/EventCard.svelte";
  import NostrMain from "./NostrMain.svelte";
  import { setFollowingList } from "$lib/func/nostr";
  import SetRepoReactions from "./NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "./NostrMainData/TimelineList.svelte";
  import { Triangle, SkipForward } from "lucide-svelte";
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

  let amount = 50;
  let viewIndex = 0;

  const handleScrollToBottom = () => {
    const lastEvent = document.querySelector(".event-card:last-child");
    if (lastEvent) {
      lastEvent.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNext = () => {
    viewIndex += 20;
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - 20, 0);
    }
  };
</script>

<h1 class="text-5xl text-orange-600">timeline</h1>

<NostrMain let:pubkey let:localRelays>
  <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
    <div slot="loading">loading</div>
    <div slot="error">error</div>
    <div slot="nodata">nodata</div>

    <div class="container break-words overflow-x-hidden">
      <Contacts
        queryKey={["timeline", "contacts", pubkey]}
        {pubkey}
        let:contacts
        let:status
        ><div slot="loading">loading</div>
        <div slot="error">error</div>
        <div slot="nodata">nodata</div>

        <TimelineList
          queryKey={["timeline", "feed", pubkey]}
          filters={[
            {
              authors: pubkeysIn(contacts),
              kinds: [1, 6, 16],
              limit: 70,
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
          {viewIndex}
          {amount}
          let:len
        >
          <SetRepoReactions />
          <div slot="loading">
            <p>Loading...</p>
          </div>

          <div slot="error" let:error>
            <p>{error}</p>
          </div>

          <div class="max-w-[100vw] break-words box-border">
            {#if viewIndex !== 0}
              <button
                class="w-full bg-magnum-400 p-1 rounded-sm ring-1 ring-magnum-200"
                on:click={() => (viewIndex = 0)}
                ><SkipForward size={20} class="mx-auto -rotate-90" /></button
              >
              <button
                class="w-full bg-magnum-400 p-1 rounded-sm ring-1 ring-magnum-200"
                on:click={() => handlePrev()}
                ><Triangle size={20} class="mx-auto " /></button
              >
            {/if}
            {#if events && events.length > 0}
              {#each events as event (event.id)}
                <div
                  class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden event-card"
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
                    <EventCard {metadata} note={event} />
                  </Metadata>
                </div>
              {/each}
            {/if}
          </div>

          <button
            class="w-full bg-magnum-400 p-1 rounded-sm ring-1 ring-magnum-200"
            on:click={() => handleNext()}
            ><Triangle size={20} class="mx-auto rotate-180 " /></button
          >
        </TimelineList>
      </Contacts>
    </div>
  </SetDefaultRelays>
</NostrMain>
