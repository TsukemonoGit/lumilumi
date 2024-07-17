<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import ListLinkCard from "$lib/components/NostrElements/Note/ListLinkCard.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import ListUsersCard from "$lib/components/NostrMainData/ListUsersCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetGlobalRelays from "$lib/components/NostrMainData/SetGlobalRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { setTieKey } from "$lib/func/nostr";
  import { loginUser, tieMapStore } from "$lib/stores/stores";
  import { nip04 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";

  import { createRxForwardReq, createTie, now } from "rx-nostr";
  import { onMount } from "svelte";

  export let data: {
    identifier: string;
    pubkey: string;
    kind: number;
    relays?: string[] | undefined;
  };
  const atag = `${data.kind}:${data.pubkey}${data.identifier}`;
  const filters: Nostr.Filter[] = [
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ];
  console.log(filters);
  let amount = 50;
  let viewIndex = 0;
  const tieKey = "naddr";

  onMount(() => {
    setTieKey(tieKey);
  });
  afterNavigate(() => {
    setTieKey(tieKey);
  });

  const pubkeyList = async (event: Nostr.Event): Promise<string[]> => {
    const pubList = event.tags
      .filter((tag) => tag[0] === "p")
      .map((tag) => tag[1]);

    if (event.content.length <= 0) {
      return pubList;
    }
    try {
      const prvListStr = await (
        window.nostr as Nostr.Nip07.Nostr
      ).nip04?.decrypt(
        $loginUser ??
          (await (window.nostr as Nostr.Nip07.Nostr).getPublicKey()),
        event.content
      );
      if (prvListStr) {
        const prvList: string[][] = JSON.parse(prvListStr);
        if (prvList.length > 0) {
          const prv = prvList
            .filter((tag) => tag[0] === "p")
            .map((tag) => tag[1]);
          return Array.from(new Set([...pubList, ...prv]));
        } else {
          return pubList;
        }
      } else {
        return pubList;
      }
    } catch (error) {
      return pubList;
    }
  };
</script>

<section class="container">
  <LatestEvent queryKey={["naddr", atag]} {filters} let:event>
    <div slot="loading">loading</div>
    <div slot="error">error</div>
    <div slot="nodata">nodata</div>
    <div class="w-full flex justify-between">
      <ListLinkCard {event} />
    </div>

    {#await pubkeyList(event)}
      waiting decrypt list
    {:then pubkeys}
      <ListUsersCard {pubkeys} />
      <div class="w-full break-words overflow-hidden">
        <TimelineList
          queryKey={["list", "feed", atag]}
          filters={[
            {
              kinds: [1, 6, 16],
              authors: pubkeys,
              limit: 50,
              since: now(),
            },
          ]}
          req={createRxForwardReq()}
          let:events
          {viewIndex}
          {amount}
          let:len
          {tieKey}
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
              {#each events as event, index (event.id)}<div
                  class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden {index ===
                  events.length - 1
                    ? 'last-visible'
                    : ''} {index === 0 ? 'first-visible' : ''}"
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
                </div>{/each}{/if}
          </div>
        </TimelineList>
      </div>{/await}</LatestEvent
  >
</section>
