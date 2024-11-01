<script lang="ts">
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import {
    defaultRelays,
    followList,
    loginUser,
    onlyFollowee,
    queryClient,
  } from "$lib/stores/stores";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { createToggleGroup, melt } from "@melt-ui/svelte";

  import * as Nostr from "nostr-typedef";
  import { Heart, Repeat2, Reply, Zap } from "lucide-svelte";
  import NotificationFilter from "./NotificationFilter.svelte";

  import { extractKind9734 } from "$lib/func/makeZap";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import EventCard from "$lib/components/NostrElements/Note/EventCard/EventCard.svelte";
  import NotificationList from "./NotificationList.svelte";
  let amount = 50;
  let viewIndex = 0;
  // const [tie, tieMap] = createTie();
  // tieMapStore.set(tieMap);
  const tieKey = "notifications";

  let isOnMount = false;

  const timelineQuery: QueryKey = ["notifications"];
  let filters: Nostr.Filter[] = [
    {
      kinds: [1, 6, 7, 16, 42, 9735, 4 /**初代DM*/, 1059 /** 三代目DM */],

      "#p": [$loginUser],
      since: undefined,
      until: undefined,
      limit: undefined,
    },
  ];
  $: readRelays = $defaultRelays
    ? Object.values($defaultRelays)
        .filter((config) => config.read)
        .map((value) => value.url)
    : [];
  $: console.log(readRelays);
  let view = false;
  onMount(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
      view = true;
    }
  });
  afterNavigate(async () => {
    if (!isOnMount) {
      isOnMount = true;
      await init();

      isOnMount = false;
      view = true;
    }
  });
  beforeNavigate(() => {
    view = false;
  });
  async function init() {
    const ev: EventPacket[] | undefined =
      $queryClient?.getQueryData(timelineQuery);
    if (!ev || ev.length <= 0) {
      filters[0].since = undefined;
      filters[0].limit = 100;
      filters[0].until = now();
    } else {
      filters[0].since = ev[0].event.created_at;
      filters[0].until = now();
    }
  }

  //---------------------------
  // const {
  //   elements: { root, list, content, trigger },
  //   states: { value },
  // } = createTabs({
  //   defaultValue: "all",
  // });

  const triggers = [
    // { id: "all", title: "all" }, // <p> を削除し、単なる文字列として扱う

    { id: "reaction", title: Heart }, // アイコンコンポーネント
    { id: "reply", title: Reply }, // アイコンコンポーネント
    { id: "repost", title: Repeat2 }, // アイコンコンポーネント
    { id: "zap", title: Zap }, // Zapを追加
    { id: "other", title: "other" },
  ];
  const {
    elements: { root, item },
    states: { value },
  } = createToggleGroup({
    type: "multiple",
    defaultValue: triggers.map((trigger) => trigger.id), //初期は全部選択
  });
  // const [send, receive] = crossfade({
  //   duration: 250,
  //   easing: cubicInOut,
  // });

  $: console.log($value); //= ['reply', 'reaction', 'repost']みたいに選択されてるIDのりすとになる

  const handleClickAll = () => {
    value.set(triggers.map((trigger) => trigger.id));
  };
  const handleClickNone = () => {
    value.set([]);
  };

  export const getFollowFilteredEvents = (
    events: Nostr.Event[],
    onlyFollowee: boolean
  ) => {
    if (onlyFollowee && $followList) {
      return events.filter((event) => {
        if (event.kind !== 9735) {
          return $followList.has(event.pubkey);
        } else {
          const kind9734 = extractKind9734(event);
          return kind9734 && $followList.has(kind9734.pubkey);
        }
      });
    } else {
      return events;
    }
  };

  let notifilter = (event: Nostr.Event): boolean => {
    if (event.pubkey === $loginUser) {
      return false;
    }
    if ($onlyFollowee && $followList) {
      //フォロイーのみ
      if (event.kind !== 9735) {
        if (!$followList.has(event.pubkey)) return false;
      } else {
        const kind9734 = extractKind9734(event);
        if (kind9734 !== undefined && !$followList.has(kind9734.pubkey)) {
          return false;
        }
      }
    }
    if (event.kind === 7) {
      if (
        event.tags.findLast((tag) => tag[0] === "p" && tag.length > 1)?.[1] !==
        $loginUser
      ) {
        return false;
      }
    }
    //  return true;
    return filterSelectedStates(event);
  };
  //tabの選択状況によってのフィルターもTimelineListの中でやろうかと思ったけどnext🔻押したときの挙動がー（allではにページ目だけど他のとこではまだ一ページ目でなんとかかんとかとか）だからやめておく
  //filterしたあとの長さで考えたらへんになるねと思ったけどなんとかなったかも
  const filterSelectedStates = (event: Nostr.Event): boolean => {
    if (!$value || typeof $value === "string") return true;

    return $value.some((state) => {
      switch (state) {
        case "reply":
          return event.kind === 1;
        case "reaction":
          return event.kind === 7;
        case "repost":
          return event.kind === 6 || event.kind === 16;
        case "zap":
          return event.kind === 9735;
        case "other":
          return (
            event.kind === 42 ||
            event.kind === 4 ||
            //  event.kind === 14 ||
            event.kind === 1059
          );
        default:
          return false;
      }
    });
  };
  let updateViewEvent: any;
  $: if ($value || $onlyFollowee) {
    if (updateViewEvent) {
      updateViewEvent();
    }
  }
</script>

<!-- <svelte:head>
  <title>Lumilumi-Notifications</title>
  <meta property="og:description" content="Notifications" />
  <meta name="description" content="Notifications" />
</svelte:head> -->
<section>
  <NotificationFilter />
  <div class="w-full break-words overflow-x-hidden">
    <div use:melt={$root} class=" flex items-center">
      <button
        class="toggle-item relative w-full"
        disabled={$value?.length === triggers.length}
        on:click={handleClickAll}
      >
        All
      </button>

      {#each triggers as triggerItem}
        <button
          use:melt={$item(triggerItem.id)}
          class="toggle-item relative w-full"
        >
          <!-- Svelteコンポーネントとしてアイコンを扱う -->
          {#if typeof triggerItem.title === "string"}
            {triggerItem.title}
          {:else}
            <svelte:component this={triggerItem.title} />
          {/if}
        </button>
      {/each}
      <button
        class="toggle-item relative w-full"
        disabled={$value?.length === 0}
        on:click={handleClickNone}
      >
        None
      </button>
    </div>
    {#if view}
      <NotificationList
        queryKey={timelineQuery}
        {filters}
        let:events
        {viewIndex}
        {amount}
        bind:eventFilter={notifilter}
        {tieKey}
        bind:updateViewEvent
      >
        <!-- <div slot="loading">
          <p>Loading...</p>
        </div> -->

        <!-- <SetRepoReactions /> -->
        <div
          class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
        >
          {#if events && events.length > 0}
            {#each events as event, index (event.id)}
              <Metadata
                queryKey={["metadata", event.pubkey]}
                pubkey={event.pubkey}
                let:metadata
              >
                <div slot="loading" class="w-full">
                  <EventCard note={event} {tieKey} />
                </div>
                <div slot="nodata" class="w-full">
                  <EventCard note={event} {tieKey} />
                </div>
                <div slot="error" class="w-full">
                  <EventCard note={event} {tieKey} />
                </div>
                <EventCard {metadata} note={event} {tieKey} /></Metadata
              >
            {/each}
          {/if}
        </div>
      </NotificationList>{/if}
  </div>
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
  .toggle-item {
    display: flex;
    align-items: center;
    justify-content: center;

    user-select: none;

    border-radius: 0;
    background-color: theme("colors.neutral.800");

    color: theme("colors.magnum.200");
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
      background-color: theme("colors.magnum.700");
      color: theme("colors.magnum.100");
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

  .toggle-item[data-state="on"] {
    @apply bg-magnum-200 text-magnum-900;
  }
  .toggle-item:disabled {
    @apply bg-magnum-200 text-magnum-900;
  }
</style>
