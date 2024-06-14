<script lang="ts">
  import Text from "../NostrMainData/Text.svelte";
  import Metadata from "../NostrMainData/Metadata.svelte";
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard.svelte";
  export let id: string;
  export let mini: boolean = false;
</script>

<Text queryKey={["timeline", id]} {id} let:text>
  <div slot="loading">
    <p>Loading {nip19.noteEncode(id)}</p>
  </div>
  <div slot="nodata">
    <p>nodata {nip19.noteEncode(id)}</p>
  </div>
  <div slot="error" let:error>
    <p>{error} {nip19.noteEncode(id)}</p>
  </div>
  <Metadata
    queryKey={["metadata", text.pubkey]}
    pubkey={text.pubkey}
    let:metadata
  >
    <div slot="loading">
      <EventCard note={text} {mini} />
    </div>
    <div slot="nodata">
      <EventCard note={text} {mini} />
    </div>
    <div slot="error" let:error>
      <EventCard note={text} {mini} />
    </div>
    <EventCard note={text} {metadata} {mini} />
  </Metadata>
</Text>
