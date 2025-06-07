<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import Link from "$lib/components/Elements/Link.svelte";

  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";

  import { queryClient } from "$lib/stores/stores";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import { nip19 } from "nostr-tools";
  import { onMount } from "svelte";
  //import * as Nostr from "nostr-typedef";
  import { t as _ } from "@konemono/svelte5-i18n";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  const timelineQuery: QueryKey = ["globalchannel"];
  let amount = 50;
  let viewIndex = 0;

  let isOnMount = false;
  let since: number | undefined = $state(undefined);

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });

  afterNavigate(async (navigate) => {
    console.log("afterNavigate", navigate.type);
    if (navigate.type !== "form" && !isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
  });

  async function init() {
    since = undefined;

    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60; //15分くらいならもれなく取れることとして初期sinceを15分前に設定することで、初期読込時間を短縮する;;
    } else {
      since = ev[0].event.created_at;
    }
  }
</script>

<section class=" flex flex-col gap-2 max-w-full overflow-x-hidden w-full">
  {#if since}
    <TimelineList
      queryKey={timelineQuery}
      filters={[
        {
          kinds: [42],
          since: since,
        },
        {
          kinds: [16],
          "#k": ["42"],

          since: since,
        },
      ]}
      olderFilters={[
        {
          kinds: [42],
          since: since,
        },
        {
          kinds: [16],
          "#k": ["42"],

          since: since,
        },
      ]}
      req={createRxForwardReq()}
      {viewIndex}
      {amount}
      >{#snippet content({ events, len })}
        {#if events && events.length > 0}
          {#each events as event (event.id)}
            <Metadata
              queryKey={["metadata", event.pubkey]}
              pubkey={event.pubkey}
            >
              {#snippet loading()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet error()}
                <div class="w-full">
                  <EventCard note={event} />
                </div>
              {/snippet}
              {#snippet content({ metadata })}
                <EventCard {metadata} note={event} />
              {/snippet}
            </Metadata>
          {/each}{/if}
      {/snippet}
    </TimelineList>
  {/if}{#if lumiSetting.get().pubkey}
    <Link
      className="w-full border border-magnum-500 rounded-lg p-2 hover:opacity-75 active:opacity-50 flex justify-center font-semibold text-magnum-300 break-all "
      href={`https://nostviewstr.vercel.app/${nip19.npubEncode(lumiSetting.get().pubkey)}/${10005}`}
      >{$_("nostviewstr.kind10005")}<SquareArrowOutUpRight size={16} /></Link
    >{/if}
</section>
<!--部屋番号わかんないしグローバル見ながら引用するとkind1引用になる-->
<div class="postWindow">
  <OpenPostWindow visible={false} />
</div>
