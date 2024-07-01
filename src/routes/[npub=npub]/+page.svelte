<script lang="ts">
  import NostrMain from "$lib/components/NostrMainData/NostrMain.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import SetDefaultRelays from "$lib/components/NostrMainData/SetDefaultRelays.svelte";
  import SetRepoReactions from "$lib/components/NostrMainData/SetRepoReactions.svelte";
  import TimelineList from "$lib/components/NostrMainData/TimelineList.svelte";
  import { createRxForwardReq, createTie } from "rx-nostr";
  import UserProfile from "$lib/components/NostrMainData/UserProfile.svelte";
  import type { SvelteComponent } from "svelte";
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import { generateRandomId } from "$lib/func/nostr";
  import EventCard from "$lib/components/NostrElements/Note/EventCard.svelte";
  import { tieMapStore } from "$lib/stores/stores";
  export let data: {
    pubkey: string;
  };

  let amount = 50;
  let viewIndex = 0;

  let compRef1: SvelteComponent;
  let compRef2: SvelteComponent;
  let componentKey = 0; // Key to force re-render
  let view: boolean = false;
  let req = createRxForwardReq();
  beforeNavigate(() => {
    if (compRef1) {
      compRef1.$destroy();
    }
  });
  afterNavigate(() => {
    view = false;
    req = createRxForwardReq(generateRandomId());

    setTimeout(() => {
      view = true;
    }, 100);
  });
  $: userPubkey = data.pubkey; // Make pubkey reactive
  const [tie, tieMap] = createTie();
  tieMapStore.set(tieMap);
</script>

<svelte:head>
  <title>Lumilumi-User</title>
  <meta name="description" content="The Nostr webclient" />
</svelte:head>
<section>
  <h1 class="text-5xl text-orange-600">User</h1>

  <NostrMain let:pubkey let:localRelays>
    <SetDefaultRelays {pubkey} {localRelays}>
      <div slot="loading">relayloading</div>
      <div slot="error">relayerror</div>
      <div slot="nodata">relaynodata</div>
      {#if userPubkey && view}
        <div
          class="container break-words overflow-hidden"
          id={componentKey.toString()}
        >
          <UserProfile pubkey={userPubkey} />

          <TimelineList
            bind:this={compRef1}
            queryKey={["user", userPubkey]}
            filters={[
              {
                kinds: [1, 6, 16],
                limit: 50,
                authors: [userPubkey],
              },
            ]}
            {req}
            let:events
            {viewIndex}
            {amount}
            {tie}
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
                {#each events as event (event.id)}
                  <div
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
                      <EventCard {metadata} note={event} />
                    </Metadata>
                  </div>
                {/each}
              {/if}
            </div>
          </TimelineList>
        </div>
      {/if}
    </SetDefaultRelays>
  </NostrMain>
</section>
