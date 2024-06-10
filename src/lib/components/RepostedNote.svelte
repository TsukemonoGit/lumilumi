<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard.svelte";
  import Metadata from "./NostrData/Metadata.svelte";
  import Text from "./NostrData/Text.svelte";

  //tagはaかe
  export let tag: string[];
  export let kind: number | undefined;
</script>

<div class="px-2">
  {#if tag[0] === "e"}
    <!-- {#if kind}
      {kind}
    {/if} -->

    <Text queryKey={["timeline", tag[1]]} id={tag[1]} let:text>
      <div slot="loading">
        <p>Loading {nip19.noteEncode(tag[1])}</p>
      </div>
      <div slot="nodata">
        <p>nodata {nip19.noteEncode(tag[1])}</p>
      </div>
      <div slot="error" let:error>
        <p>{error} {nip19.noteEncode(tag[1])}</p>
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
  {:else if tag[0] === "a"}
    {tag}
  {/if}
</div>
