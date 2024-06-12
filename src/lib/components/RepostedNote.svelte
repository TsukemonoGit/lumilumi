<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard.svelte";
  import Metadata from "./NostrMainData/Metadata.svelte";
  import Text from "./NostrMainData/Text.svelte";
  import { nip33Regex } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";
  import LatestEvent from "./NostrMainData/LatestEvent.svelte";
  //tagはaかe
  export let tag: string[];
  export let kind: number | undefined;

  const naddrFilter = (): Nostr.Filter | undefined => {
    const match = tag[1].match(nip33Regex);
    //console.log(match);
    if (match && match.length > 3) {
      const filter: Nostr.Filter =
        match[3] !== ""
          ? {
              kinds: [Number(match[1])],
              authors: [match[2]],
              "#d": [match[3]],
            }
          : {
              kinds: [Number(match[1])],
              authors: [match[2]],
            };
      return filter;
    }
    return undefined;
  };
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
    {#await naddrFilter() then filter}
      {#if filter}
        <LatestEvent filters={[filter]} queryKey={["naddr", tag[1]]} let:event>
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
            queryKey={["metadata", event.pubkey]}
            pubkey={event.pubkey}
            let:metadata
          >
            <div slot="loading">
              <EventCard note={event} />
            </div>
            <div slot="nodata">
              <EventCard note={event} />
            </div>
            <div slot="error" let:error>
              <EventCard note={event} />
            </div>
            <EventCard note={event} {metadata} />
          </Metadata>
        </LatestEvent>
      {/if}
    {/await}
  {/if}
</div>
