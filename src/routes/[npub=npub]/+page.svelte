<script lang="ts">
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import UserProfile from "$lib/components/Elements/UserProfile.svelte";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { generateRandomId } from "$lib/func/nostr";
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

  import Kind0List from "./PaginationList.svelte";
  import Contacts from "$lib/components/NostrMainData/Contacts.svelte";
  import PaginationList from "./PaginationList.svelte";
  import Metadatanoyatu from "./Metadatanoyatu.svelte";
  import EllipsisMenuNaddr from "$lib/components/NostrElements/Note/NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import { parseNaddr } from "$lib/func/util";
  import { nip19 } from "nostr-tools";

  import type { CreateTabsProps } from "@melt-ui/svelte";

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

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
    view = true;
  });
  afterNavigate(async (navigate) => {
    console.log("afterNavigate", navigate.type);
    view = false;
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
    view = true;
  });
  beforeNavigate((navigate) => {
    console.log("beforeNavigate", navigate.type);
    $value = "post";
  });
  async function init() {
    since = undefined;
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

  // const handleChange: CreateTabsProps["onValueChange"] = ({ curr, next }) => {
  //   console.log(curr, next);

  $: if ($value) {
    const tabsElement = document?.querySelector("#userTabs");
    console.log($value);
    setTimeout(() => {
      tabsElement?.scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "instant",
      });
      window.scrollBy(0, -50);
    }, 0);
  }
  // return next;
  // };

  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    defaultValue: "post",
    //  onValueChange: handleChange,
  });

  const triggers = [
    { id: "post", title: "Post" },
    { id: "reactions", title: "Reaction" },
    { id: "bookmark", title: "Bookmark" },
    { id: "followee", title: "Follow" },

    // { id: "pin", title: "Pin" },
    { id: "relays", title: "Relay" },
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
      <UserProfile pubkey={userPubkey} depth={0} tieKey={undefined} />
      <div
        id="userTabs"
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
                      {tieKey}
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
                <!-- <SetRepoReactions /> -->
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
                          <EventCard
                            note={event}
                            excludefunc={excludeKind1}
                            {tieKey}
                          />
                        </div>
                        <div slot="nodata">
                          <EventCard
                            note={event}
                            excludefunc={excludeKind1}
                            {tieKey}
                          />
                        </div>
                        <div slot="error">
                          <EventCard
                            note={event}
                            excludefunc={excludeKind1}
                            {tieKey}
                          />
                        </div>
                        <EventCard
                          {metadata}
                          note={event}
                          excludefunc={excludeKind1}
                          {tieKey}
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
            >
              <!-- <SetRepoReactions /> -->
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
                        <EventCard
                          note={event}
                          excludefunc={excludeKind7}
                          {tieKey}
                        />
                      </div>
                      <div slot="nodata">
                        <EventCard
                          note={event}
                          excludefunc={excludeKind7}
                          {tieKey}
                        />
                      </div>
                      <div slot="error">
                        <EventCard
                          note={event}
                          excludefunc={excludeKind7}
                          {tieKey}
                        />
                      </div>
                      <EventCard
                        {metadata}
                        note={event}
                        excludefunc={excludeKind7}
                        {tieKey}
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

        <div use:melt={$content("followee")} class="content">
          {#if $value === "followee"}
            <Contacts
              queryKey={["timeline", "contacts", data.pubkey]}
              pubkey={data.pubkey}
              let:contacts
              let:status
            >
              <div slot="loading" class="p-1">
                <p>Loading...</p>
              </div>

              <div slot="error" class="p-1" let:error>
                <p>{error}</p>
              </div>
              <div slot="nodata" class="p-1">
                <p>Loading...</p>
              </div>
              {#if contacts}
                <PaginationList
                  list={contacts.tags
                    .filter((tag) => tag[0] === "p" && tag.length > 1)
                    .map((tag) => tag[1])}
                  {tieKey}
                  let:id><Metadatanoyatu pubkey={id} {tieKey} /></PaginationList
                >{/if}
            </Contacts>
          {/if}
        </div>
        <div use:melt={$content("bookmark")} class="content">
          {#if $value === "bookmark"}
            <!---->
            <LatestEvent
              queryKey={["bookmark", data.pubkey]}
              filters={[{ authors: [data.pubkey], kinds: [10003], limit: 1 }]}
              let:event
              let:status
            >
              <div slot="loading" class="p-1">
                <p>Loading...</p>
              </div>

              <div slot="error" class="p-1" let:error>
                <p>{error}</p>
              </div>
              <div slot="nodata" class="p-1">
                <p>Loading...</p>
              </div>
              {#if event}
                {@const filteredList = event.tags.filter(
                  (tag) =>
                    (tag[0] === "e" || tag[0] === "t" || tag[0] === "r") &&
                    tag.length > 1
                )}
                <PaginationList
                  list={filteredList.map((tag) => tag[1])}
                  {tieKey}
                  let:id
                  let:index
                >
                  {#if filteredList[index][0] === "e"}
                    <Note
                      {id}
                      mini={false}
                      displayMenu={true}
                      depth={0}
                      repostable={true}
                      {tieKey}
                    />
                    <!---->
                  {:else if filteredList[index][0] === "a"}
                    {@const naddr = parseNaddr(filteredList[index])}
                    <LatestEvent
                      queryKey={[
                        "naddr",
                        `${naddr.kind}:${naddr.pubkey}:${naddr.identifier}`,
                      ]}
                      filters={[
                        naddr.identifier !== ""
                          ? {
                              kinds: [naddr.kind],
                              authors: [naddr.pubkey],
                              "#d": [naddr.identifier],
                            }
                          : {
                              kinds: [naddr.kind],
                              authors: [naddr.pubkey],
                            },
                      ]}
                      let:event
                    >
                      <div
                        slot="loading"
                        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
                      >
                        {filteredList[index]}<EllipsisMenuNaddr
                          naddr={nip19.naddrEncode(naddr)}
                        />
                      </div>
                      <div
                        slot="nodata"
                        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
                      >
                        {filteredList[index]}<EllipsisMenuNaddr
                          naddr={nip19.naddrEncode(naddr)}
                        />
                      </div>
                      <div
                        slot="error"
                        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
                      >
                        {filteredList[index]}<EllipsisMenuNaddr
                          naddr={nip19.naddrEncode(naddr)}
                        />
                      </div>
                      <Metadata
                        queryKey={["metadata", event.pubkey]}
                        pubkey={event.pubkey}
                        let:metadata
                      >
                        <div slot="loading">
                          <EventCard
                            note={event}
                            displayMenu={true}
                            repostable={true}
                            {tieKey}
                          />
                        </div>
                        <div slot="nodata">
                          <EventCard
                            note={event}
                            displayMenu={true}
                            repostable={true}
                            {tieKey}
                          />
                        </div>
                        <div slot="error">
                          <EventCard
                            note={event}
                            displayMenu={true}
                            repostable={true}
                            {tieKey}
                          />
                        </div>
                        <EventCard
                          {metadata}
                          displayMenu={true}
                          repostable={true}
                          note={event}
                          {tieKey}
                        /></Metadata
                      >
                    </LatestEvent>
                    <!---->
                  {:else if filteredList[index][0] === "t"}
                    [t,{id}]
                    <!---->
                  {:else}
                    <!---->
                    [r,{id}]
                  {/if}
                </PaginationList>{/if}
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
