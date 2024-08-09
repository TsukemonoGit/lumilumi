<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  export let id: string;
  export let mini: boolean = false;
  export let maxHeight: string = "24rem";
  export let displayMenu: boolean;
  export let thread: boolean = false;
  export let depth: number;
</script>

<Text queryKey={["timeline", id]} {id} let:text>
  <div slot="loading" class="text-sm text-neutral-500 flex-inline break-all">
    Loading {nip19.noteEncode(id)}
  </div>
  <div slot="nodata" class="text-sm text-neutral-500 flex-inline break-all">
    nodata {nip19.noteEncode(id)}
  </div>
  <div
    slot="error"
    let:error
    class="text-sm text-neutral-500 flex-inline break-all"
  >
    {error}
    {nip19.noteEncode(id)}
  </div>
  <Metadata
    queryKey={["metadata", text.pubkey]}
    pubkey={text.pubkey}
    let:metadata
  >
    <div slot="loading">
      <EventCard note={text} {mini} {maxHeight} {thread} {depth} />
    </div>
    <div slot="nodata">
      <EventCard note={text} {mini} {maxHeight} {thread} {depth} />
    </div>
    <div slot="error" let:error>
      <EventCard note={text} {mini} {maxHeight} {thread} {depth} />
    </div>
    <EventCard
      note={text}
      {metadata}
      {mini}
      {maxHeight}
      {thread}
      {displayMenu}
      {depth}
    />
  </Metadata>
</Text>
