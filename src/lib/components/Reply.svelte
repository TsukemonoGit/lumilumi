<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard.svelte";
  import Text from "./NostrData/Text.svelte";
  import Metadata from "./NostrData/Metadata.svelte";
  export let replyID: string | undefined;
  export let replyUsers: string[];
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  const profile = (ev: Nostr.Event): Profile | undefined => {
    try {
      return JSON.parse(ev.content);
    } catch (error) {
      return undefined;
    }
  };

  let loadNote = false;
</script>

<div>
  {#if replyUsers.length > 0}
    <div class="text-sm text-neutral-500">
      {#each replyUsers as user}
        @<Metadata queryKey={["metadata", user]} pubkey={user} let:metadata>
          <div slot="loading">
            {nip19.npubEncode(user)}
          </div>
          <div slot="nodata">
            {nip19.npubEncode(user)}
          </div>
          <div slot="error" let:error>
            {nip19.npubEncode(user)}
          </div>
          {profile(metadata)?.name ?? profile(metadata)?.display_name}
        </Metadata>
      {/each}
    </div>
  {/if}
  {#if replyID}
    {#if !loadNote}
      <button
        class="flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        on:click={() => (loadNote = true)}>Load replied</button
      >
    {:else}
      <Text queryKey={["timeline", replyID]} id={replyID} let:text>
        <div slot="loading">
          <p>Loading {nip19.noteEncode(replyID)}</p>
        </div>
        <div slot="nodata">
          <p>nodata {nip19.noteEncode(replyID)}</p>
        </div>
        <div slot="error" let:error>
          <p>{error} {nip19.noteEncode(replyID)}</p>
        </div>
        <Metadata
          queryKey={["metadata", text.pubkey]}
          pubkey={text.pubkey}
          let:metadata
        >
          <div slot="loading">
            <EventCard note={text} />
          </div>
          <div slot="nodata">
            <EventCard note={text} />
          </div>
          <div slot="error" let:error>
            <EventCard note={text} />
          </div>
          <EventCard note={text} {metadata} />
        </Metadata>
      </Text>
    {/if}
  {/if}
</div>
