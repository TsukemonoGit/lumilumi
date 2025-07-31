<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import TimelineList from "$lib/components/renderSnippets/nostr/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import UserProfile from "$lib/components/NostrElements/user/UserProfile.svelte";
  import { onMount } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { setRelays } from "$lib/func/nostr";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import { createTabs, melt } from "@melt-ui/svelte";
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import RelayCard from "$lib/components/NostrElements/kindEvents/EventCard/RelayCard.svelte";

  import {
    ReceiptText,
    MessageSquareText,
    Zap,
    Sticker,
    BookMarked,
    Users,
    RadioTower,
    SmilePlus,
    Library,
    Images,
  } from "lucide-svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import { queryClient } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";

  import Contacts from "$lib/components/renderSnippets/nostr/Contacts.svelte";
  import PaginationList from "../../lib/components/NostrElements/UserTabs/PaginationList.svelte";
  import Metadatanoyatu from "./Metadatanoyatu.svelte";

  import { profile } from "$lib/func/util";

  import CustomEmojiTab from "$lib/components/NostrElements/UserTabs/CustomEmojiTab.svelte";
  import BookmarkTab from "$lib/components/NostrElements/UserTabs/BookmarkTab.svelte";
  import { page } from "$app/state";

  import { checkBirthDay } from "$lib/func/event";

  import EmptyCardList from "$lib/components/NostrElements/kindEvents/EventCard/EmptyCardList.svelte";
  import BirthDayFestival from "$lib/components/Fes/BirthDayFestival.svelte";

  import ListMain from "$lib/components/renderSnippets/nostr/ListMain.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserMediaDisplay from "./UserMediaDisplay.svelte";
  import PinList from "./PinList.svelte";

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
  /*  const excludeKind1 = (event: Nostr.Event) => {
    return event.kind === 1 && event.pubkey === data.pubkey;
  }; */
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
    //画像オンの時だけメディア欄を出す
    ...(lumiSetting.get().showImg
      ? [
          {
            id: "media",
            title: "Media",
            Icon: Images,
          },
        ]
      : []),
    { id: "chat", title: "Chat", Icon: MessageSquareText },
    { id: "reactions", title: "Reaction", Icon: Sticker },

    { id: "followee", title: "Follow", Icon: Users },
    { id: "emojis", title: "Emojis", Icon: SmilePlus },
    { id: "articles", title: "Articles", Icon: Library },

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

  async function init() {
    console.log(page.url.hash);
    const hash = triggers.find((t) => `#${t.id}` === page.url.hash);
    if (hash) {
      value.set(hash.id);
    } else {
      value.set("post");
    }
    //ログインしてない＝10002リレーないから
    if (!lumiSetting.get().pubkey && data.relays && data.relays.length > 0) {
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
  let isBirthDay: boolean = $state(false);
  let metadata: Nostr.Event | undefined = $state(undefined);
  const metadataChange = (_metadata: Nostr.Event) => {
    metadata = _metadata;
    const prof = profile(_metadata);
    isBirthDay = checkBirthDay(prof);
  };
  beforeNavigate(() => {
    isBirthDay = false;
  });
</script>

<section>
  {#if userPubkey && view}
    <div
      class="w-full break-words overflow-hidden"
      id={componentKey.toString()}
    >
      <UserProfile pubkey={userPubkey} depth={0} tab={$value} />
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
              class="trigger relative flex-col gap-1 min-w-16 text-sm"
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
        <div
          use:melt={$content("post")}
          class="content max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
          {#if $value === "post"}
            <PinList {userPubkey} />

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
              >
                {#snippet content({ events, len })}
                  <!-- <SetRepoReactions /> -->

                  {#if events && events.length > 0}
                    {#each events as event, index (event.id)}
                      <Metadata
                        queryKey={["metadata", event.pubkey]}
                        pubkey={event.pubkey}
                      >
                        {#snippet loading()}
                          <div>
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div>
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div>
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard {metadata} note={event} />
                        {/snippet}
                      </Metadata>
                      <!-- </div> -->
                    {/each}
                  {/if}
                {/snippet}
                {#snippet loading()}
                  <EmptyCardList length={10} />
                {/snippet}

                {#snippet error()}
                  <div>
                    <p>{error}</p>
                  </div>
                {/snippet}
              </TimelineList>{/if}
          {/if}
        </div>
        <div
          use:melt={$content("chat")}
          class="content max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
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
              >
                {#snippet content({ events })}
                  <!-- <SetRepoReactions /> -->

                  {#if events && events.length > 0}
                    {#each events as event, index (event.id)}
                      <Metadata
                        queryKey={["metadata", event.pubkey]}
                        pubkey={event.pubkey}
                      >
                        {#snippet loading()}
                          <div>
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div>
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div>
                            <EventCard note={event} />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard {metadata} note={event} />
                        {/snippet}
                      </Metadata>
                      <!-- </div> -->
                    {/each}
                  {/if}
                {/snippet}
                {#snippet loading()}
                  <EmptyCardList length={10} />
                {/snippet}

                {#snippet error()}
                  <div>
                    <p>{error}</p>
                  </div>
                {/snippet}
              </TimelineList>{/if}
          {/if}
        </div>
        <div
          use:melt={$content("reactions")}
          class="content max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
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
            >
              {#snippet content({ events })}
                {#if events && events.length > 0}
                  {#each events as event, index (event.id)}
                    <Metadata
                      queryKey={["metadata", event.pubkey]}
                      pubkey={event.pubkey}
                    >
                      {#snippet loading()}
                        <div>
                          <EventCard note={event} excludefunc={excludeKind7} />
                        </div>
                      {/snippet}
                      {#snippet nodata()}
                        <div>
                          <EventCard note={event} excludefunc={excludeKind7} />
                        </div>
                      {/snippet}
                      {#snippet error()}
                        <div>
                          <EventCard note={event} excludefunc={excludeKind7} />
                        </div>
                      {/snippet}
                      {#snippet content({ metadata })}
                        <EventCard
                          {metadata}
                          note={event}
                          excludefunc={excludeKind7}
                        />
                      {/snippet}
                    </Metadata>
                  {/each}
                {/if}
              {/snippet}
              {#snippet loading()}
                <EmptyCardList length={10} />
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
            >
              {#snippet content({ events })}
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
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                            />
                          </div>
                        {/snippet}
                        {#snippet nodata()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                            />
                          </div>
                        {/snippet}
                        {#snippet error()}
                          <div>
                            <EventCard
                              note={event}
                              excludefunc={excludeKind7}
                            />
                          </div>
                        {/snippet}
                        {#snippet content({ metadata })}
                          <EventCard
                            {metadata}
                            note={event}
                            excludefunc={excludeKind7}
                          />
                        {/snippet}
                      </Metadata>
                    {/each}
                  {/if}
                </div>{/snippet}
              {#snippet loading()}
                <EmptyCardList length={10} />
              {/snippet}

              {#snippet error()}
                <div>
                  <p>{error}</p>
                </div>
              {/snippet}
            </TimelineList>
          {/if}
        </div>

        <div
          use:melt={$content("relays")}
          class="content max-w-[100vw] break-words divide-y divide-magnum-600/30"
        >
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
                <EmptyCardList length={10} />
              {/snippet}

              {#snippet error()}
                <div class="p-1">
                  <p>{error}</p>
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="p-1">
                  <p>relays nodata</p>
                </div>
              {/snippet}

              {#snippet children({ event })}
                {#each event.tags.filter((tag) => tag[0] === "r") as [r, url, rw], index}
                  <div class=" overflow-hidden p-1">
                    <RelayCard
                      zIndex={0}
                      {url}
                      read={!rw || rw === "read" ? true : false}
                      write={!rw || rw === "write" ? true : false}
                    />
                  </div>
                {/each}
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
                <EmptyCardList length={10} />
              {/snippet}

              {#snippet error()}
                <div class="p-1">
                  <p>{error}</p>
                </div>
              {/snippet}
              {#snippet nodata()}
                <div class="p-1">
                  <p>nodata</p>
                </div>
              {/snippet}
              {#snippet content({ contacts, status })}
                {#if contacts}
                  <PaginationList
                    list={contacts.tags
                      .filter((tag) => tag[0] === "p" && tag.length > 1)
                      .map((tag) => tag[1])
                      .slice()
                      .reverse()}
                    >{#snippet children(event, index)}
                      {@const id = event as string}
                      <Metadatanoyatu pubkey={id} />
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
        <div
          use:melt={$content("articles")}
          class="content max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
          {#if $value === "articles"}
            <ListMain
              queryKey={["kind30023", userPubkey]}
              pubkey={userPubkey}
              kind={30023}
              >{#snippet loading()}
                loading
              {/snippet}
              {#snippet nodata()}
                No articles found
              {/snippet}
              {#snippet children({ events })}
                {#each events as event}
                  <EventCard note={event} {metadata} />
                {/each}
              {/snippet}
            </ListMain>
          {/if}
        </div>

        <div
          use:melt={$content("media")}
          class="content max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
          {#if $value === "media"}
            <UserMediaDisplay pubkey={data.pubkey} />
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
<Metadata
  queryKey={["metadata", data.pubkey]}
  pubkey={data.pubkey}
  onChange={metadataChange}
></Metadata>
{#if isBirthDay}
  <BirthDayFestival {metadata} />
{/if}

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
