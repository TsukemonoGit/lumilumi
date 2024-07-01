<script lang="ts">
  import { createRxForwardReq } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  import SetDefaultRelays from "./NostrMainData/SetDefaultRelays.svelte";
  import Contacts from "./NostrMainData/Contacts.svelte";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import NostrMain from "./NostrMainData/NostrMain.svelte";
  import { setFollowingList, pubkeysIn } from "$lib/func/nostr";
  import SetRepoReactions from "./NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "./NostrMainData/TimelineList.svelte";
  import EventCard from "./NostrElements/Note/EventCard.svelte";

  let amount = 50; //1ページに表示する量
  let viewIndex = 0;
</script>

<h1 class="text-5xl text-orange-600">timeline</h1>

<NostrMain let:pubkey let:localRelays>
  <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
    <div slot="loading">loading</div>
    <div slot="error">error</div>
    <div slot="nodata">nodata</div>

    <div class="container break-words overflow-hidden">
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
              limit: 50,
            },
            {
              kinds: [
                1 /*リプライ*/, 6 /*kind1のリポスト*/,
                /*16,kind1以外のリポスト（ktag）*/ 7 /*リアクション kタグ*/,
                9735 /*zap receipt**/,
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
        </TimelineList>
      </Contacts>
    </div>
  </SetDefaultRelays>
</NostrMain>
