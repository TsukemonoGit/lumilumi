<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import { encodetoNote } from "$lib/func/encode";
  import NoteByRelayhint from "./NoteByRelayhint.svelte";
  export let id: string;
  export let mini: boolean = false;
  export let maxHeight: string = "24rem";
  export let displayMenu: boolean;
  export let thread: boolean = false;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
  export let relayhint: string[] | undefined = undefined;
  $: loadingText = encodetoNote(id);
</script>

<Text queryKey={["timeline", id]} {id} let:text let:status>
  <div
    slot="loading"
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    Loading {loadingText}{#if displayMenu}<EllipsisMenuNote
        notestr={loadingText}
      />{/if}
  </div>
  <div slot="nodata">
    {#if relayhint && relayhint.length > 0}
      <NoteByRelayhint
        {id}
        {mini}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
        {relayhint}
      />
    {:else}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        nodata {loadingText}{#if displayMenu}<EllipsisMenuNote
            notestr={loadingText}
          />{/if}
      </div>
    {/if}
  </div>
  <div
    slot="error"
    let:error
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    {nip19.noteEncode(id)}{#if displayMenu}<EllipsisMenuNote
        notestr={nip19.noteEncode(id)}
      />{/if}
  </div>
  <Metadata
    queryKey={["metadata", text.pubkey]}
    pubkey={text.pubkey}
    let:metadata
  >
    <div slot="loading">
      <EventCard
        note={text}
        {mini}
        {maxHeight}
        {thread}
        {depth}
        {repostable}
        {tieKey}
      />
    </div>
    <div slot="nodata">
      <EventCard
        note={text}
        {mini}
        {maxHeight}
        {thread}
        {depth}
        {repostable}
        {tieKey}
      />
    </div>
    <div slot="error" let:error>
      <EventCard
        note={text}
        {mini}
        {maxHeight}
        {thread}
        {depth}
        {repostable}
        {tieKey}
      />
    </div>
    <EventCard
      note={text}
      {metadata}
      {mini}
      {maxHeight}
      {thread}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    />
  </Metadata>
</Text>
