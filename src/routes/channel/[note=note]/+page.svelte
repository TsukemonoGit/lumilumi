<script lang="ts">
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  //import * as Nostr from "nostr-typedef";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";

  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { setRelays } from "$lib/func/nostr";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/Note/ChannelMetadata.svelte";
  import { defaultRelays, loginUser, queryClient } from "$lib/stores/stores";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import { nip19 } from "nostr-tools";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };
  //チャンネルでのリポストって誰に向けて見せたくてリポストしてるのかわからんくて扱いにくいから
  //引用だけにしてみる
  //Globalのチャンネルフィードにはkind16リポストk=16を表示することにしてみる。
  //repostable={false}チャンネル部屋ではリポストできないようにしてみる（kindで判断じゃなくてチャンネル部屋にいるときだけだけどダイジョブ？？？）
  let amount = 50;
  let viewIndex = 0;
  const tieKey = `channel+${data.id}`;

  let isOnMount = false;
  let since: number | undefined = undefined;
  $: timelineQuery = ["channel", "feed", data.id]; //部屋から部屋に移動したときにconstだとだめだった
  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();
    }
  });
  afterNavigate((navigate) => {
    console.log("afterNavigate", navigate.type);
    if (!isOnMount) {
      isOnMount = true;
      init();
    }
  });
  let view = false;
  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    view = false;
  });
  async function init() {
    since = undefined;

    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60; //15分くらいならもれなく取れることとして初期sinceを15分前に設定することで、初期読込時間を短縮する;
    } else {
      since = ev[0].event.created_at;
    }
    isOnMount = false;
    view = true;
  }
</script>

<svelte:head>
  <meta
    name="description"
    content="Public chat 
RoomId:{nip19.neventEncode({
      id: data.id,
      relays: data.relays ?? [],
    })}"
  />

  <meta
    property="og:description"
    content="Public chat 
RoomId:{nip19.neventEncode({
      id: data.id,
      relays: data.relays ?? [],
    })}"
  />
</svelte:head>

{#if view}
  <section class="w-full break-words overflow-hidden">
    <ChannelMetadata
      id={data.id}
      linkButtonTitle={`/channel/${nip19.noteEncode(data.id)}`}
      {tieKey}
    />{#if since}
      <TimelineList
        queryKey={timelineQuery}
        filters={[
          {
            "#e": [data.id],
            kinds: [42],
            since: since,
          },
          // {
          //   kinds: [16],
          //   "#k": ["42"],
          //   limit: 20,

          //   since: since,
          // },
          // {
          //   kinds: [7], //   "#k": ["42"],
          //   "#p": [$loginUser],
          //   "#e": [data.id],
          //   limit: 20,

          //   since: since,
          // },
        ]}
        req={createRxForwardReq()}
        let:events
        {viewIndex}
        {amount}
        {tieKey}
        let:len
        eventFilter={(event) =>
          (event.kind === 42 &&
            event.tags.find(
              (tag) => tag[0] === "e" && tag.length > 1 && tag[1] === data.id
            ) !== undefined) ||
          event.kind !== 42}
      >
        <!-- <SetRepoReactions /> -->
        <div slot="loading">
          <p>Loading...</p>
        </div>

        <div slot="error" let:error>
          <p>{error}</p>
        </div>

        <div
          class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
          {#if events && events.length > 0}
            {#each events as event, index (event.id)}
              <!-- <div
                class="max-w-full break-words whitespace-pre-line box-border overflow-hidden event-card {index ===
                events.length - 1
                  ? 'last-visible'
                  : ''} {index === 0 ? 'first-visible' : ''}"
              > -->
              <Metadata
                queryKey={["metadata", event.pubkey]}
                pubkey={event.pubkey}
                let:metadata
              >
                <div slot="loading" class="w-full">
                  <EventCard note={event} repostable={false} {tieKey} />
                </div>
                <div slot="nodata" class="w-full">
                  <EventCard note={event} repostable={false} {tieKey} />
                </div>
                <div slot="error" class="w-full">
                  <EventCard note={event} repostable={false} {tieKey} />
                </div>
                <EventCard
                  {metadata}
                  note={event}
                  repostable={false}
                  {tieKey}
                />
              </Metadata>
              <!-- </div> -->
            {/each}
          {/if}
        </div>
      </TimelineList>{/if}
  </section>
{/if}
<div class="postWindow">
  <OpenPostWindow options={{ tags: [["e", data.id, "", "root"]], kind: 42 }} />
</div>
