<script lang="ts">
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, createTie, now, tie } from "rx-nostr";
  import UserProfile from "$lib/components/Elements/UserProfile.svelte";
  import { onMount, type SvelteComponent } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { generateRandomId, setTieKey } from "$lib/func/nostr";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import { tieMapStore } from "$lib/stores/stores";
  import { createTabs, melt } from "@melt-ui/svelte";
  import { cubicInOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import Note from "$lib/components/NostrElements/Note/Note.svelte";
  import RelayCard from "$lib/components/NostrElements/Note/RelayCard.svelte";

  export let data: {
    pubkey: string;
  };

  let amount = 50;
  let viewIndex = 0;

  let componentKey = 0; // Key to force re-render
  let view: boolean = false;
  let req = createRxForwardReq();

  afterNavigate(() => {
    view = false;
    req = createRxForwardReq(generateRandomId());

    setTimeout(() => {
      view = true;
    }, 100);
  });
  $: userPubkey = data.pubkey; // Make pubkey reactive
  const tieKey = "npub";

  onMount(() => {
    setTieKey(tieKey);
  });
  afterNavigate(() => {
    setTieKey(tieKey);
  });

  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    defaultValue: "post",
  });

  const triggers = [
    { id: "post", title: "Post" },
    { id: "reactions", title: "Reactions" },
    { id: "pin", title: "Pin" },
    { id: "relays", title: "Relays" },
  ];

  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });
</script>

<svelte:head>
  <title>Lumilumi-User</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>

<section>
  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays}>
      <div slot="loading">relayloading</div>
      <div slot="error">relayerror</div>
      <div slot="nodata">relaynodata</div>
      {#if userPubkey && view}
        <div
          class="w-full break-words overflow-hidden"
          id={componentKey.toString()}
        >
          <UserProfile pubkey={userPubkey} />
          <div
            use:melt={$root}
            class={"flex w-full flex-col overflow-hidden rounded-xl shadow-lg  data-[orientation=vertical]:flex-row"}
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
            <div use:melt={$content("post")}>
              {#if $value === "post"}
                <TimelineList
                  queryKey={["user", "post", userPubkey]}
                  filters={[
                    {
                      kinds: [1, 6, 16],
                      limit: 50,
                      authors: [userPubkey],
                      since: now(),
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

                  <div class="max-w-[100vw] break-words box-border">
                    {#if events && events.length > 0}
                      {#each events.filter( (event) => [1, 6, 16].includes(event.kind) ) as event, index (event.id)}
                        <div
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
                            <EventCard {metadata} note={event} />
                          </Metadata>
                        </div>
                      {/each}
                    {/if}
                  </div>
                </TimelineList>
              {/if}
            </div>
            <div use:melt={$content("reactions")}>
              {#if $value === "reactions"}
                <TimelineList
                  queryKey={["user", "reactions", userPubkey]}
                  filters={[
                    {
                      kinds: [7],
                      limit: 50,
                      authors: [userPubkey],
                      since: now(),
                    },
                  ]}
                  {req}
                  let:events
                  {viewIndex}
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

                  <div class="max-w-[100vw] break-words box-border">
                    {#if events && events.length > 0}
                      {#each events as event, index (event.id)}
                        <div
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
                            <EventCard {metadata} note={event} />
                          </Metadata>
                        </div>
                      {/each}
                    {/if}
                  </div>
                </TimelineList>
              {/if}
            </div>
            <div use:melt={$content("pin")}>
              {#if $value === "pin"}
                <LatestEvent
                  queryKey={["pin", userPubkey]}
                  filters={[
                    {
                      kinds: [10001],
                      limit: 1,
                      authors: [userPubkey],
                    },
                  ]}
                  {req}
                  let:event
                >
                  <SetRepoReactions />
                  <div slot="loading">
                    <p>pin Loading...</p>
                  </div>

                  <div slot="error" let:error>
                    <p>{error}</p>
                  </div>
                  <div slot="nodata">
                    <p>nodata</p>
                  </div>
                  <div class="max-w-[100vw] break-words box-border">
                    {#each event.tags.filter((tag) => tag[0] === "e") as [e, id], index}
                      <div
                        class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden"
                      >
                        <Note {id} />
                      </div>
                    {/each}
                  </div>
                </LatestEvent>
              {/if}
            </div>
            <div use:melt={$content("relays")}>
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
                  {req}
                  let:event
                >
                  <div slot="loading">
                    <p>pin Loading...</p>
                  </div>

                  <div slot="error" let:error>
                    <p>{error}</p>
                  </div>

                  <div class="max-w-[100vw] break-words">
                    {#each event.tags.filter((tag) => tag[0] === "r") as [r, url, rw], index}
                      <div
                        class="rounded-md border overflow-hidden border-magnum-600 my-1"
                      >
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
    </SetDefaultRelays>
  </NostrMain>
</section>

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
      background-color: theme(colors.neutral.800);

      color: theme("colors.magnum.500");
    }
  }

  input {
    height: theme(spacing.8);
    flex-shrink: 0;
    flex-grow: 1;
    border-radius: theme(borderRadius.md);
    border: 1px solid theme(colors.neutral.200);
    padding-inline: theme(spacing[2.5]);
    line-height: 1;
    color: theme(colors.neutral.900);

    &:focus {
      border-color: theme(colors.magnum.400);
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
</style>
