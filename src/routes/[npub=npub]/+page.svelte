<script lang="ts">
  import NostrMain from "$lib/components/NostrMain.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import Reactionsforme from "$lib/components/NostrMainData/Reactionsforme.svelte";
  import SetGlobalRelays from "$lib/components/NostrMainData/SetGlobalRelays.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import EventCard from "$lib/components/Note/EventCard.svelte";
  import { createRxForwardReq } from "rx-nostr";
  import UserProfile from "$lib/components/NostrMainData/UserProfile.svelte";
  import { SkipForward, Triangle } from "lucide-svelte";
  export let data;

  let amount = 50;
  let viewIndex = 0;

  const handleScrollToBottom = () => {
    const lastEvent = document.querySelector(".event-card:last-child");
    if (lastEvent) {
      lastEvent.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNext = () => {
    viewIndex += 20;
  };

  const handlePrev = () => {
    if (viewIndex > 0) {
      viewIndex = Math.max(viewIndex - 20, 0);
    }
  };
</script>

<svelte:head>
  <title>Lumilumi-User</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<section>
  <h1 class="text-5xl text-orange-600">User</h1>

  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays} let:relays let:status>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>
      <div class="container break-words overflow-x-hidden">
        <UserProfile pubkey={data.pubkey} />

        <TimelineList
          queryKey={["usertimeline", "feed", data.pubkey]}
          filters={[
            {
              kinds: [1, 6, 16],
              limit: 40,
              authors: [data.pubkey],
            },
          ]}
          req={createRxForwardReq()}
          let:events
          {viewIndex}
          {amount}
          let:len
        >
          <SetRepoReactions />
          <div slot="loading">
            <p>Loading...</p>
          </div>

          <div slot="error" let:error>
            <p>{error}</p>
          </div>

          <div class="max-w-[100vw] break-words box-border">
            {#if viewIndex !== 0}
              <button
                class="w-full bg-magnum-400"
                on:click={() => (viewIndex = 0)}
                ><SkipForward size={20} class="mx-auto -rotate-90" /></button
              >
              <button class="w-full bg-magnum-400" on:click={() => handlePrev()}
                ><Triangle size={20} class="mx-auto " /></button
              >
            {/if}

            {#each events as event (event.id)}<div
                class="max-w-full break-words whitespace-pre-line m-1 box-border overflow-hidden"
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
                  <EventCard {metadata} note={event} /></Metadata
                >
              </div>{/each}
          </div>
          <button class="w-full bg-magnum-400" on:click={() => handleNext()}
            ><Triangle size={20} class="mx-auto rotate-180" /></button
          >
        </TimelineList>
      </div>
    </SetDefaultRelays>
  </NostrMain>
</section>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>