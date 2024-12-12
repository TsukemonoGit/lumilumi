<script lang="ts">
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  //import * as Nostr from "nostr-typedef";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";

  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import { setRelays } from "$lib/func/nostr";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import ChannelMetadata from "$lib/components/NostrElements/kindEvents/ChannelMetadata.svelte";
  import { defaultRelays, queryClient } from "$lib/stores/stores";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import { nip19 } from "nostr-tools";

  import { mutes } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";
  import type { PageData } from "./$types";
  import { timelineFilter } from "$lib/stores/globalRunes.svelte";

  // interface Props {
  //   data: {
  //     id: string;
  //     relays?: string[] | undefined;
  //     kind?: number | undefined;
  //     author?: string | undefined;
  //   };
  // }

  let { data }: { data: PageData } = $props();

  //チャンネルでのリポストって誰に向けて見せたくてリポストしてるのかわからんくて扱いにくいから
  //引用だけにしてみる
  //Globalのチャンネルフィードにはkind16リポストk=16を表示することにしてみる。
  //repostable={false}チャンネル部屋ではリポストできないようにしてみる（kindで判断じゃなくてチャンネル部屋にいるときだけだけどダイジョブ？？？）
  let amount = 50;
  let viewIndex = 0;
  let tieKey = $derived(`channel+${data.id}`);

  let isOnMount = false;
  let since: number | undefined = $state(undefined);
  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();
    }
  });
  afterNavigate((navigate) => {
    console.log("afterNavigate", navigate.type);
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      init();
    }
  });
  let view = $state(false);
  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      view = false;
    }
  });
  async function init() {
    since = undefined;

    if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }
    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
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

  function channelMuteCheck(id: string, adaptMute: boolean): boolean {
    if (!adaptMute) {
      return false;
    }
    const eMutes = $mutes.list.e || [];
    return eMutes.includes(id);
  }
  let timelineQuery = $derived(["channel", "feed", data.id]); //部屋から部屋に移動したときにconstだとだめだった
  let isMute = $derived(
    channelMuteCheck(data.id, timelineFilter.get.adaptMute)
  );
</script>

{#if view}
  <section class="w-full break-words overflow-hidden">
    <ChannelMetadata
      id={data.id}
      linkButtonTitle={`/channel/${nip19.noteEncode(data.id)}`}
      {tieKey}
    />
    {#if isMute}
      <!---->
      {$_("mute.channel")}
    {:else if since}
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
        olderFilters={[
          {
            "#e": [data.id],
            kinds: [42],
            since: since,
          },
        ]}
        req={createRxForwardReq()}
        {viewIndex}
        {amount}
        {tieKey}
        eventFilter={(event) =>
          (event.kind === 42 &&
            event.tags.find(
              (tag) => tag[0] === "e" && tag.length > 1 && tag[1] === data.id
            ) !== undefined) ||
          event.kind !== 42}
      >
        {#snippet content({ events, len })}
          <!-- <SetRepoReactions /> -->
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
                >
                  {#snippet loading()}
                    <div class="w-full">
                      <EventCard note={event} repostable={false} {tieKey} />
                    </div>
                  {/snippet}
                  {#snippet nodata()}
                    <div class="w-full">
                      <EventCard note={event} repostable={false} {tieKey} />
                    </div>
                  {/snippet}
                  {#snippet error()}
                    <div class="w-full">
                      <EventCard note={event} repostable={false} {tieKey} />
                    </div>
                  {/snippet}
                  {#snippet content({ metadata })}
                    <EventCard
                      {metadata}
                      note={event}
                      repostable={false}
                      {tieKey}
                    />
                  {/snippet}
                </Metadata>
                <!-- </div> -->
              {/each}
            {/if}
          </div>{/snippet}
        {#snippet loading()}
          <div>
            <p>Loading...</p>
          </div>
        {/snippet}

        {#snippet error()}
          <div>
            <p>{error}</p>
          </div>
        {/snippet}
      </TimelineList>{/if}
  </section>
{/if}
<div class="postWindow">
  <OpenPostWindow options={{ tags: [["e", data.id, "", "root"]], kind: 42 }} />
</div>
