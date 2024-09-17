<script lang="ts">
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, now, type EventPacket } from "rx-nostr";
  import { loginUser, onlyFollowee, queryClient } from "$lib/stores/stores";
  import { afterNavigate } from "$app/navigation";
  import { getFollowingList, setTieKey } from "$lib/func/nostr";
  import { onMount } from "svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import type { QueryKey } from "@tanstack/svelte-query";
  import { createToggleGroup, melt } from "@melt-ui/svelte";
  import { crossfade } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import * as Nostr from "nostr-typedef";
  import { Heart, Repeat2, Reply, Zap } from "lucide-svelte";
  import NotificationFilter from "./NotificationFilter.svelte";

  import { extractKind9734 } from "$lib/func/makeZap";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  let amount = 50;
  let viewIndex = 0;
  // const [tie, tieMap] = createTie();
  // tieMapStore.set(tieMap);
  const tieKey = "notifications";

  let isOnMount = false;
  let since: number | undefined = undefined;
  const timelineQuery: QueryKey = ["notifications", "feed"];
  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });
  afterNavigate(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });

  async function init() {
    since = undefined;
    setTieKey(tieKey);

    const ev: EventPacket[] | undefined = $queryClient?.getQueryData([
      ...timelineQuery,
      "olderData",
    ]);
    if (!ev || ev.length <= 0) {
      since = now() - 15 * 60;
    } else {
      since = ev[0].event.created_at;
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
  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });

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
    const followee = getFollowingList();
    if (onlyFollowee && followee) {
      return events.filter((event) => {
        if (event.kind !== 9735) {
          return followee.includes(event.pubkey);
        } else {
          const kind9734 = extractKind9734(event);
          return kind9734 && followee.includes(kind9734.pubkey);
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
    const followee = getFollowingList();
    if ($onlyFollowee && followee) {
      //フォロイーのみ
      if (event.kind !== 9735) {
        if (!followee.includes(event.pubkey)) return false;
      } else {
        const kind9734 = extractKind9734(event);
        if (kind9734 !== undefined && !followee.includes(kind9734.pubkey)) {
          return false;
        }
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
            event.kind === 42 || event.kind === 4 //||
            //  event.kind === 14 ||
            //  event.kind === 1059
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

<svelte:head>
  <title>Lumilumi-Notifications</title>
  <meta property="og:description" content="Notifications" />
  <meta name="description" content="Notifications" />
</svelte:head>
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
    {#if since}
      <TimelineList
        queryKey={timelineQuery}
        filters={[
          {
            kinds: [
              1, 6, 7, 16, 42, 9735, 4 /**初代DM*/,
            ] /** 2代目DM 14? ,  三代目DM 1059 pに自分のpubが入ってくるわけじゃないからこれではこうどくできないよ*/,

            "#p": [$loginUser],
            since: since,
          },
        ]}
        req={createRxForwardReq()}
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

        <div slot="error" let:error>
          <p>{error}</p>
        </div>
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
                  <EventCard note={event} />
                </div>
                <div slot="nodata" class="w-full">
                  <EventCard note={event} />
                </div>
                <div slot="error" class="w-full">
                  <EventCard note={event} />
                </div>
                <EventCard {metadata} note={event} /></Metadata
              >
            {/each}
          {/if}
        </div>
      </TimelineList>{/if}
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
