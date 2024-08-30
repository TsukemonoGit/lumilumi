<script lang="ts">
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import UserProfile from "$lib/components/Elements/UserProfile.svelte";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { generateRandomId, setTieKey } from "$lib/func/nostr";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import { createTabs, melt } from "@melt-ui/svelte";
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import Note from "$lib/components/NostrElements/Note/Note.svelte";
  import RelayCard from "$lib/components/NostrElements/Note/RelayCard.svelte";
  import { Pin } from "lucide-svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import { queryClient } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  export let data: {
    pubkey: string;
  };

  let amount = 50;
  let viewIndex = 0;
  let viewIndex1 = 0;
  let componentKey = 0; // Key to force re-render
  let view: boolean = false;
  let req = createRxForwardReq();
  const excludeKind1 = (event: Nostr.Event) => {
    return event.kind === 1 && event.pubkey === data.pubkey;
  };
  const excludeKind7 = (event: Nostr.Event) => {
    return event.kind === 7 && event.pubkey === data.pubkey;
  };
  afterNavigate(() => {
    view = false;
    setTieKey(tieKey);
    req = createRxForwardReq(generateRandomId());

    setTimeout(() => {
      view = true;
    }, 100);
  });
  $: userPubkey = data.pubkey; // Make pubkey reactive
  const tieKey = "npub";

  let isOnMount = false;
  let since: number | undefined = undefined;
  $: timelineQuery = ["user", "post", userPubkey];
  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
    view = true;
  });
  afterNavigate(() => {
    view = false;
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
    view = true;
  });
  beforeNavigate(() => {
    $value = "post";
  });
  async function init() {
    since = undefined;
    setTieKey(tieKey);
    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now();
    } else {
      since = ev[0].event.created_at;
    }
  }
  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    defaultValue: "post",
  });

  const triggers = [
    { id: "post", title: "Post" },
    { id: "reactions", title: "Reactions" },
    // { id: "pin", title: "Pin" },
    { id: "relays", title: "Relays" },
  ];

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });
</script>

<svelte:head>
  <title>Lumilumi-User</title>
  <meta property="og:description" content="User" />
  <meta name="description" content="User" />
</svelte:head>

<section>
  {#if userPubkey && view}
    <div
      class="w-full break-words overflow-hidden"
      id={componentKey.toString()}
    >
      <UserProfile pubkey={userPubkey} depth={0} />
      <div
        use:melt={$root}
        class={"flex w-full flex-col overflow-hidden rounded-xl shadow-lg  data-[orientation=vertical]:flex-row mt-4 border border-neutral-500"}
      >
        <div
          use:melt={$list}
          class="flex shrink-0 overflow-x-auto
                  data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r"
        >
          {#each triggers as triggerItem}
            <button
              use:melt={$trigger(triggerItem.id)}
              class="trigger relative"
            >
              {triggerItem.title}
              {#if $value === triggerItem.id}
                <div
                  in:send={{ key: "trigger" }}
                  out:receive={{ key: "trigger" }}
                  class="absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-magnum-400"
                />
              {/if}
            </button>
          {/each}
        </div>
        <div use:melt={$content("post")} class="content">
          {#if $value === "post"}
            <LatestEvent
              queryKey={["pin", userPubkey]}
              filters={[
                {
                  kinds: [10001],
                  limit: 1,
                  authors: [userPubkey],
                },
              ]}
              let:event
            >
              <!-- <SetRepoReactions />
                  <div slot="loading" class="p-1">
                    <p>pin Loading...</p>
                  </div>

                  <div slot="error" class="p-1" let:error>
                    <p>{error}</p>
                  </div>
                  <div slot="nodata" class="p-1">
                    <p>nodata</p>
                  </div> -->

              <div
                class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 border-b border-magnum-600/30 w-full"
              >
                {#each event.tags.filter((tag) => tag[0] === "e") as [e, id], index}
                  <div
                    class="max-w-full break-words whitespace-pre-line box-border overflow-hidden"
                  >
                    <Pin class="-rotate-45 text-magnum-400" /><Note
                      {id}
                      displayMenu={true}
                      depth={1}
                      repostable={true}
                    />
                  </div>
                {/each}
              </div>
            </LatestEvent>
            {#if since}
              <TimelineList
                queryKey={timelineQuery}
                filters={[
                  {
                    kinds: [1, 6, 16],
                    limit: 50,
                    authors: [userPubkey],
                    since: since,
                  },
                ]}
                {req}
                let:events
                {viewIndex}
                {amount}
                {tieKey}
              >
                <SetRepoReactions />
                <div slot="loading">
                  <p>timeline Loading...</p>
                </div>

                <div slot="error" let:error>
                  <p>{error}</p>
                </div>

                <div
                  class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
                >
                  {#if events && events.length > 0}
                    {#each events.filter( (event) => [1, 6, 16].includes(event.kind) ) as event, index (event.id)}
                      <!-- <div
                        class="max-w-full break-words whitespace-pre-line box-border overflow-hidden {index ===
                        events.length - 1
                          ? 'last-visible'
                          : ''} {index === 0 ? 'first-visible' : ''}"
                      > -->
                      <Metadata
                        queryKey={["metadata", event.pubkey]}
                        pubkey={event.pubkey}
                        let:metadata
                      >
                        <div slot="loading">
                          <EventCard note={event} excludefunc={excludeKind1} />
                        </div>
                        <div slot="nodata">
                          <EventCard note={event} excludefunc={excludeKind1} />
                        </div>
                        <div slot="error">
                          <EventCard note={event} excludefunc={excludeKind1} />
                        </div>
                        <EventCard
                          {metadata}
                          note={event}
                          excludefunc={excludeKind1}
                        />
                      </Metadata>
                      <!-- </div> -->
                    {/each}
                  {/if}
                </div>
              </TimelineList>{/if}
          {/if}
        </div>
        <div use:melt={$content("reactions")} class="content">
          {#if $value === "reactions"}
            <TimelineList
              queryKey={["user", "reactions", userPubkey]}
              filters={[
                {
                  kinds: [7, 17],
                  limit: 50,
                  authors: [userPubkey],
                  since: now(),
                },
              ]}
              {req}
              let:events
              viewIndex={viewIndex1}
              {amount}
              {tieKey}
              lastfavcheck={false}
            >
              <SetRepoReactions />
              <div slot="loading">
                <p>timeline Loading...</p>
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
                      class="max-w-full break-words whitespace-pre-line box-border overflow-hidden {index ===
                      events.length - 1
                        ? 'last-visible'
                        : ''} {index === 0 ? 'first-visible' : ''}"
                    > -->
                    <Metadata
                      queryKey={["metadata", event.pubkey]}
                      pubkey={event.pubkey}
                      let:metadata
                    >
                      <div slot="loading">
                        <EventCard note={event} excludefunc={excludeKind7} />
                      </div>
                      <div slot="nodata">
                        <EventCard note={event} excludefunc={excludeKind7} />
                      </div>
                      <div slot="error">
                        <EventCard note={event} excludefunc={excludeKind7} />
                      </div>
                      <EventCard
                        {metadata}
                        note={event}
                        excludefunc={excludeKind7}
                      />
                    </Metadata>
                    <!-- </div> -->
                  {/each}
                {/if}
              </div>
            </TimelineList>
          {/if}
        </div>

        <div use:melt={$content("relays")} class="content">
          {#if $value === "relays"}
            <LatestEvent
              queryKey={["relays", userPubkey]}
              filters={[
                {
                  kinds: [10002],
                  limit: 1,
                  authors: [userPubkey],
                },
              ]}
              let:event
            >
              <div slot="loading" class="p-1">
                <p>relays Loading...</p>
              </div>

              <div slot="error" class="p-1" let:error>
                <p>{error}</p>
              </div>
              <div slot="nodata" class="p-1">
                <p>relays Loading...</p>
              </div>

              <div
                class="max-w-[100vw] break-words divide-y divide-magnum-600/30"
              >
                {#each event.tags.filter((tag) => tag[0] === "r") as [r, url, rw], index}
                  <div class=" overflow-hidden p-1">
                    <RelayCard
                      {url}
                      read={!rw || rw === "read" ? true : false}
                      write={!rw || rw === "write" ? true : false}
                    />
                  </div>
                {/each}
              </div>
            </LatestEvent>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</section>
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>

<style lang="postcss">
  .trigger {
    display: flex;
    align-items: center;
    justify-content: center;

    cursor: default;
    user-select: none;

    border-radius: 0;
    background-color: theme(colors.neutral.700);

    color: theme(colors.neutral.100);
    font-weight: 500;
    line-height: 1;

    flex: 1;
    height: theme(spacing.12);
    padding-inline: theme(spacing.2);

    &:focus {
      position: relative;
    }

    &:focus-visible {
      @apply z-10 ring-2;
    }

    &[data-state="active"] {
      @apply focus:relative;
      background-color: theme(colors.neutral.900);

      color: theme("colors.magnum.500");
    }
  }

  .save {
    display: inline-flex;
    height: theme(spacing.8);
    cursor: default;
    align-items: center;
    justify-content: center;
    border-radius: theme(borderRadius.md);
    background-color: theme(colors.magnum.200);
    padding-inline: theme(spacing.4);
    line-height: 1;
    font-weight: theme(fontWeight.semibold);
    color: theme(colors.magnum.900);
    @apply transition;

    &:hover {
      opacity: 0.75;
    }

    &:focus {
      @apply !ring-green-600;
    }
  }

  .content {
    @apply min-h-4;
  }
</style>
