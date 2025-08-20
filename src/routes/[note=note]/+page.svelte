<script lang="ts">
  import AllReactions from "$lib/components/renderSnippets/nostr/reaction/AllReactions.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import { defaultRelays } from "$lib/stores/stores";
  import EventCard from "$lib/components/NostrElements/kindEvents/EventCard/EventCard.svelte";
  import ZapReactionList from "$lib/components/NostrElements/AllReactionsElement/ZapReactionList.svelte";
  import NoteReactionList from "$lib/components/NostrElements/AllReactionsElement/NoteReactionList.svelte";
  import NoteRepostList from "$lib/components/NostrElements/AllReactionsElement/NoteRepostList.svelte";
  import CollapsibleList from "$lib/components/Elements/CollapsibleList.svelte";
  import { goto } from "$app/navigation";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { sortEvents } from "$lib/func/util";
  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import * as nip19 from "nostr-tools/nip19";
  import * as Nostr from "nostr-typedef";
  import NoteInfo from "$lib/components/NostrElements/kindEvents/NoteInfo.svelte";
  import { type PageData } from "./$types";
  import type { Profile } from "$lib/types";

  let { data }: { data: PageData } = $props();

  const EVENT_CONSTANTS = {
    repostable: true,
    maxHeight: 0,
    displayMenu: true,
    thread: true,
    depth: 0,
  };

  const handleChannelRedirect = (event: Nostr.Event): boolean => {
    if (event.kind === 40) {
      goto(`/channel/${data.encoded}`);
      return true;
    }
    return false;
  };
  let metadata: Profile | null = $state(null);
  const onCheangeMetadata = (ev: Nostr.Event) => {
    try {
      metadata = JSON.parse(ev.content) as Profile;
    } catch (error) {}
  };
</script>

{#snippet eventDisplay(event: Nostr.Event)}
  {@const isChannel = handleChannelRedirect(event)}
  {#if !isChannel}
    <Metadata
      queryKey={["metadata", event.pubkey]}
      pubkey={event.pubkey}
      onChange={onCheangeMetadata}
    >
      {#snippet loading()}
        <div
          class="w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard note={event} {...EVENT_CONSTANTS} />
          <NoteInfo note={event} />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div
          class="w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard note={event} {...EVENT_CONSTANTS} />
          <NoteInfo note={event} />
        </div>
      {/snippet}
      {#snippet error()}
        <div
          class="w-full divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard note={event} {...EVENT_CONSTANTS} />
          <NoteInfo note={event} />
        </div>
      {/snippet}
      {#snippet content({ metadata })}
        <div
          class="divide-y divide-magnum-600/30 p-1 rounded-md border border-magnum-400/50"
        >
          <EventCard note={event} {metadata} {...EVENT_CONSTANTS} />
          <NoteInfo note={event} />
        </div>
      {/snippet}
    </Metadata>

    <div>
      <AllReactions id={data.id}>
        {#snippet loading()}
          <div>loading</div>
        {/snippet}
        {#snippet nodata()}
          <div>nodata</div>
        {/snippet}
        {#snippet error()}
          <div>{error}</div>
        {/snippet}
        {#snippet children({ kind1, kind6, kind7, kind9735, status })}
          <NoteRepostList events={kind6} {status} />
          <NoteReactionList events={kind7} {status} />
          <ZapReactionList events={kind9735} {status} />

          <CollapsibleList title="Comments" amount={kind1.length} {status}>
            <div
              class="max-w-[100vw] break-words box-border divide-y divide-magnum-600/30 w-full"
            >
              {#each sortEvents(kind1).reverse() as event (event.id)}
                <Metadata
                  queryKey={["metadata", event.pubkey]}
                  pubkey={event.pubkey}
                >
                  {#snippet loading()}
                    <div>
                      <EventCard
                        note={event}
                        depth={0}
                        repostable={EVENT_CONSTANTS.repostable}
                      />
                    </div>
                  {/snippet}
                  {#snippet nodata()}
                    <div>
                      <EventCard
                        note={event}
                        depth={0}
                        repostable={EVENT_CONSTANTS.repostable}
                      />
                    </div>
                  {/snippet}
                  {#snippet error()}
                    <div>
                      <EventCard
                        note={event}
                        depth={0}
                        repostable={EVENT_CONSTANTS.repostable}
                      />
                    </div>
                  {/snippet}
                  {#snippet content({ metadata })}
                    <EventCard
                      {metadata}
                      note={event}
                      depth={0}
                      repostable={EVENT_CONSTANTS.repostable}
                    />
                  {/snippet}
                </Metadata>
              {/each}
            </div>
          </CollapsibleList>
        {/snippet}
      </AllReactions>
    </div>
  {/if}
{/snippet}

{#if $defaultRelays && Object.entries($defaultRelays).length > 0}
  <section class="mb-20">
    <div class="max-w-[100vw] break-words box-border w-full">
      {#if data.event}
        {@render eventDisplay(data.event)}
      {:else}
        <Text queryKey={["note", data.id]} id={data.id}>
          {#snippet loading()}
            <div class="w-full text-sm text-neutral-500 flex-inline break-all">
              Loading {nip19.noteEncode(data.id)}
            </div>
          {/snippet}
          {#snippet nodata()}
            <div class="text-sm text-neutral-500 flex-inline break-all">
              nodata {nip19.noteEncode(data.id)}
            </div>
          {/snippet}
          {#snippet error()}
            <div class="w-full text-sm text-neutral-500 flex-inline break-all">
              {nip19.noteEncode(data.id)}
            </div>
          {/snippet}
          {#snippet content({ data: text, status })}
            {@render eventDisplay(text)}
          {/snippet}
        </Text>
      {/if}
    </div>
  </section>

  <div class="postWindow">
    <OpenPostWindow options={{ tags: [], kind: 1 }} />
  </div>
{/if}
