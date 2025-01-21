<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import UserProfile from "$lib/components/NostrElements/user/UserProfile.svelte";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { generateRandomId, setRelays } from "$lib/func/nostr";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import { createTabs, melt } from "@melt-ui/svelte";
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import Note from "$lib/components/NostrElements/kindEvents/Note.svelte";
  import RelayCard from "$lib/components/NostrElements/kindEvents/EventCard/RelayCard.svelte";

  import {
    Pin,
    ReceiptText,
    MessageSquareText,
    Smile,
    Zap,
    Sticker,
    BookMarked,
    Users,
    RadioTower,
    SmilePlus,
  } from "lucide-svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import { loginUser, queryClient } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";

  import Contacts from "$lib/components/renderSnippets/nostr/Contacts.svelte";
  import PaginationList from "../../lib/components/NostrElements/UserTabs/PaginationList.svelte";
  import Metadatanoyatu from "./Metadatanoyatu.svelte";

  import { parseNaddr } from "$lib/func/util";
  import { hexRegex, nip33Regex } from "$lib/func/regex";

  import NaddrEvent from "$lib/components/NostrElements/kindEvents/NaddrEvent.svelte";
  import CustomEmojiTab from "$lib/components/NostrElements/UserTabs/CustomEmojiTab.svelte";
  import BookmarkTab from "$lib/components/NostrElements/UserTabs/BookmarkTab.svelte";
  import { page } from "$app/state";

  interface Props {
    data: {
      pubkey: string;
      relays?: string[] | undefined;
      nip05Address?: string;
    };
  }

  let { data }: Props = $props();

  let amount = 50;

  let componentKey = 0; // Key to force re-render
  let view: boolean = $state(false);

  // svelte-ignore non_reactive_update
  let req = createRxForwardReq();
  const excludeKind1 = (event: Nostr.Event) => {
    return event.kind === 1 && event.pubkey === data.pubkey;
  };
  const excludeKind7 = (event: Nostr.Event) => {
    return event.kind === 7 && event.pubkey === data.pubkey;
  };

  let userPubkey = $derived(data.pubkey); // Make pubkey reactive

  let isOnMount = false;
  let since: number | undefined = $state(undefined);
  let timelineQuery = $derived(["user", "post", userPubkey]);

  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    // defaultValue: "post",
    //  onValueChange: handleChange,
  });

  const triggers = [
    { id: "post", title: "Post", Icon: ReceiptText },
    { id: "chat", title: "Chat", Icon: MessageSquareText },
    { id: "reactions", title: "Reaction", Icon: Sticker },

    { id: "followee", title: "Follow", Icon: Users },
    { id: "emojis", title: "Emojis", Icon: SmilePlus },
    { id: "bookmark", title: "Bookmark", Icon: BookMarked },

    { id: "zap", title: "Zapped", Icon: Zap },
    // { id: "pin", title: "Pin" },
    { id: "relays", title: "Relay", Icon: RadioTower },
  ];

  const [send, receive] = crossfade({
    duration: 150,
    easing: cubicInOut,
  });

  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
    }
    view = true;
  });

  afterNavigate(async (navigate) => {
    // console.log("afterNavigate", navigate.type);
    if (navigate.type !== "form") {
      view = false;
      if (!isOnMount) {
        isOnMount = true;
        await init();

        isOnMount = false;
      }
      view = true;
    }
  });
  beforeNavigate((navigate) => {
    //console.log("beforeNavigate", navigate.type);
    if (navigate.type !== "form") {
      $value = "post";
    }
  });
  async function init() {
    console.log(page.url.hash);
    const hash = triggers.find((t) => `#${t.id}` === page.url.hash);
    if (hash) {
      value.set(hash.id);
    } else {
      value.set("post");
    }
    //ログインしてない＝10002リレーないから
    if (!$loginUser && data.relays && data.relays.length > 0) {
      setRelays(data.relays);
    }
    since = undefined;
    const ev: EventPacket[] | undefined = queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now();
    } else {
      since = ev[0].event.created_at;
    }
    // console.log(data.nip05Address);
    if (data.nip05Address) {
      queryClient?.setQueryData(
        ["nip05", data.pubkey, data.nip05Address.toLowerCase()],
        {
          result: true,
        }
      );
    }
  }

  // const handleChange: CreateTabsProps["onValueChange"] = ({ curr, next }) => {
  //   console.log(curr, next);

  // return next;
  // };

  value.subscribe((v) => {
    if (v) {
      window.location.hash = v;
      const tabsElement = document?.querySelector("#userTabs");
      setTimeout(() => {
        tabsElement?.scrollIntoView({
          block: "start",
          inline: "nearest",
          behavior: "instant",
        });
        window.scrollBy(0, -100);
      }, 0);
    }
  });
</script>

<!-- <svelte:head>
  <meta
    name="description"
    content="User:{data.pubkey
      ? `pubkey:${nip19.npubEncode(data.pubkey)}`
      : ''}"
  />

  <meta
    property="og:description"
    content="User:{data.pubkey
      ? `pubkey:${nip19.npubEncode(data.pubkey)}`
      : ''}"
  /> 
</svelte:head>-->

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
        class={"flex w-full flex-col overflow-hidden rounded-xl shadow-lg  data-[orientation=vertical]:flex-row mt-4 border border-neutral-500 "}
      >
        <div
          use:melt={$list}
          class="flex shrink-0 flex-wrap overflow-x-auto
                  data-[orientation=vertical]:flex-col data-[orientation=vertical]:border-r"
        >
          {#each triggers as triggerItem}
            <button
              use:melt={$trigger(triggerItem.id)}
              class="trigger relative flex-col gap-1 min-w-20"
            >
              {#if triggerItem.Icon}<triggerItem.Icon
                  size={20}
                  class="min-h-[20px]"
                />{/if}{triggerItem.title}
              {#if $value === triggerItem.id}
                <div
                  in:send={{ key: "trigger" }}
                  out:receive={{ key: "trigger" }}
                  class="absolute bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-magnum-400"
                ></div>
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
            >
              {#snippet children({ event })}
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
                  {#each event.tags.filter((tag: string[]) => (tag[0] === "e" && hexRegex.test(tag[1])) || (tag[0] === "a" && nip33Regex.test(tag[1]))) as [e, id], index}
                    <div>
                      <Pin
                        class="-rotate-45 text-magnum-400"
                      />{#if e === "e"}<Note
                          {id}
                          displayMenu={true}
                          depth={1}
                          repostable={true}
                          tieKey={userPubkey}
                        />{:else}
                        <NaddrEvent
                          data={parseNaddr([e, id])}
                          displayMenu={true}
                          depth={1}
                          repostable={true}
                          tieKey={userPubkey}
                          content={id}
                        />
                      {/if}
                    </div>
                  {/each}
                </div>
              {/snippet}
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
                olderFilters={[
                  {
                    kinds: [1, 6, 16],

                    authors: [userPubkey],
                    since: since,
                  },
                ]}
                {req}
                {amount}
                tieKey={userPubkey}
              >
                {#snippet content({ events, len })}
                  <!-- <SetRepoReactions /> -->
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
                        >
                          {#snippet loading()}
                            <div>
                              <EventCard note={event} tieKey={userPubkey} />
                            </div>
                          {/snippet}
                          {#snippet nodata()}
                            <div>
                              <EventCard note={event} tieKey={userPubkey} />
                            </div>
                          {/snippet}
                          {#snippet error()}
                            <div>
                              <EventCard note={event} tieKey={userPubkey} />
                            </div>
                          {/snippet}
                          {#snippet content({ metadata })}
                            <EventCard
                              {metadata}
                              note={event}
                              tieKey={userPubkey}
                            />
                          {/snippet}
                        </Metadata>
                        <!-- </div> -->
                      {/each}
                    {/if}
                  </div>{/snippet}
                {#snippet loading()}
                  <div>
                    <p class="px-2">timeline Loading...</p>
                  </div>
                {/snippet}

                {#snippet error()}
                  <div>
                    <p>{error}</p>
                  </div>
                {/snippet}
              </TimelineList>{/if}
          {/if}
        </div>
        <div use:melt={$content("chat")} class="content">
          {#if $value === "chat"}
            {#if since}
              <TimelineList
                queryKey={["publck chat", userPubkey]}
                filters={[
                  {
                    kinds: [42],

                    authors: [userPubkey],
                    since: since,
                  },
                ]}
                olderFilters={[
                  {
                    kinds: [42],

                    authors: [userPubkey],
                    since: since,
                  },
                ]}
                {req}
                {amount}
                tieKey={userPubkey}
              >
                {#snippet content({ events })}
                  <!-- <SetRepoReactions /> -->
                  <div
                    class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
                  >
                    {#if events && events.length > 0}
                      {#each events as event, index (event.id)}
                        <Metadata
                          queryKey={["metadata", event.pubkey]}
                          pubkey={event.pubkey}
                        >
                          {#snippet loading()}
                            <div>
                              <EventCard note={event} tieKey={userPubkey} />
                            </div>
                          {/snippet}
                          {#snippet nodata()}
                            <div>
                              <EventCard note={event} tieKey={userPubkey} />
                            </div>
                          {/snippet}
                          {#snippet error()}
                            <div>
                              <EventCard note={event} tieKey={userPubkey} />
                            </div>
                          {/snippet}
                          {#snippet content({ metadata })}
                            <EventCard
                              {metadata}
                              note={event}
                              tieKey={userPubkey}
                            />
                          {/snippet}
                        </Metadata>
                        <!-- </div> -->
                      {/each}
                    {/if}
                  </div>{/snippet}
                {#snippet loading()}
                  <div>
                    <p class="px-2">public chat Loading...</p>
                  </div>
                {/snippet}

                {#snippet error()}
                  <div>
                    <p>{error}</p>
                  </div>
                {/snippet}
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
              olderFilters={[
                {
                  kinds: [7, 17],
                  limit: 50,
                  authors: [userPubkey],
                  since: now(),
                },
              ]}
              {req}
              {amount}
              tieKey={userPubkey}
            >
              {#snippet content({ events })}
                <!-- <SetRepoReactions /> -->
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
                      >
                        {#snippet loading()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                              tieKey={userPubkey}
                            />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                              tieKey={userPubkey}
                            />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                              tieKey={userPubkey}
                            />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard
                            {metadata}
                            note={event}
                            excludefunc={excludeKind7}
                            tieKey={userPubkey}
                          />
                        {/snippet}
                      </Metadata>
                      <!-- </div> -->
                    {/each}
                  {/if}
                </div>{/snippet}
              {#snippet loading()}
                <div>
                  <p class="px-2">timeline Loading...</p>
                </div>
              {/snippet}

              {#snippet error()}
                <div>
                  <p>{error}</p>
                </div>
              {/snippet}
            </TimelineList>
          {/if}
        </div>

        <!--zap-->
        <div use:melt={$content("zap")} class="content">
          {#if $value === "zap"}
            <TimelineList
              queryKey={["user", "zap", userPubkey]}
              filters={[
                {
                  kinds: [9735],
                  limit: 50,
                  "#p": [userPubkey],
                  since: now(),
                },
              ]}
              olderFilters={[
                {
                  kinds: [9735],
                  limit: 50,
                  "#p": [userPubkey],
                  since: now(),
                },
              ]}
              {req}
              viewIndex={0}
              {amount}
              tieKey={userPubkey}
            >
              {#snippet content({ events })}
                <!-- <SetRepoReactions /> -->
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
                      >
                        {#snippet loading()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                              tieKey={userPubkey}
                            />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                              tieKey={userPubkey}
                            />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                              tieKey={userPubkey}
                            />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard
                            {metadata}
                            note={event}
                            excludefunc={excludeKind7}
                            tieKey={userPubkey}
                          />
                        {/snippet}
                      </Metadata>
                      <!-- </div> -->
                    {/each}
                  {/if}
                </div>{/snippet}
              {#snippet loading()}
                <div>
                  <p class="px-2">timeline Loading...</p>
                </div>
              {/snippet}

              {#snippet error()}
                <div>
                  <p>{error}</p>
                </div>
              {/snippet}
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
            >
              {#snippet loading()}
                <div class="p-1">
                  <p>relays Loading...</p>
                </div>
              {/snippet}

              {#snippet error()}
                <div class="p-1">
                  <p>{error}</p>
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="p-1">
                  <p>relays Loading...</p>
                </div>
              {/snippet}

              {#snippet children({ event })}
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
              {/snippet}
            </LatestEvent>
          {/if}
        </div>

        <div use:melt={$content("followee")} class="content">
          {#if $value === "followee"}
            <Contacts
              queryKey={["timeline", "contacts", data.pubkey]}
              pubkey={data.pubkey}
            >
              {#snippet loading()}
                <div class="p-1">
                  <p>Loading...</p>
                </div>
              {/snippet}

              {#snippet error()}
                <div class="p-1">
                  <p>{error}</p>
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="p-1">
                  <p>Loading...</p>
                </div>
              {/snippet}
              {#snippet content({ contacts, status })}
                {#if contacts}
                  <PaginationList
                    list={contacts.tags
                      .filter((tag) => tag[0] === "p" && tag.length > 1)
                      .map((tag) => tag[1])}
                    tieKey={userPubkey}
                    >{#snippet children({ id })}
                      <Metadatanoyatu pubkey={id} tieKey={userPubkey} />
                    {/snippet}
                  </PaginationList>{/if}
              {/snippet}
            </Contacts>
          {/if}
        </div>
        <div use:melt={$content("bookmark")} class="content">
          {#if $value === "bookmark"}
            <BookmarkTab pubkey={userPubkey} />
          {/if}
        </div>
        <div use:melt={$content("emojis")} class="content">
          {#if $value === "emojis"}
            <CustomEmojiTab pubkey={userPubkey} />
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
    height: theme(spacing.14);
    /* padding-inline: theme(spacing.2); */

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
