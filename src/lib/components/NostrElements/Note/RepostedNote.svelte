<script lang="ts">
  import { nip19 } from "nostr-tools";

  import { nip33Regex } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";
  import EventCard from "./EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";

  //tagはaかe
  export let tag: string[];
  export let kind: number | undefined;
  export let depth: number;
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
      <div
        slot="loading"
        class="text-sm text-neutral-500 flex-inline break-all"
      >
        Loading {nip19.noteEncode(tag[1])}
      </div>
      <div slot="nodata" class="text-sm text-neutral-500 flex-inline break-all">
        nodata {nip19.noteEncode(tag[1])}
      </div>
      <div
        slot="error"
        class="text-sm text-neutral-500 flex-inline break-all"
        let:error
      >
        {error}
        {nip19.noteEncode(tag[1])}
      </div>
      <Metadata
        queryKey={["metadata", text.pubkey]}
        pubkey={text.pubkey}
        let:metadata
      >
        <div slot="loading">
          <EventCard note={text} {depth} />
        </div>
        <div slot="nodata">
          <EventCard note={text} {depth} />
        </div>
        <div slot="error" let:error>
          <EventCard note={text} {depth} />
        </div>
        <EventCard note={text} {metadata} {depth} />
      </Metadata>
    </Text>
  {:else if tag[0] === "a"}
    {#await naddrFilter() then filter}
      {#if filter}
        <LatestEvent filters={[filter]} queryKey={["naddr", tag[1]]} let:event>
          <div slot="loading">
            <p>Loading {tag[1]}</p>
          </div>
          <div slot="nodata">
            <p>nodata {tag[1]}</p>
          </div>
          <div slot="error" let:error>
            <p>{error} {tag[1]}</p>
          </div>
          <Metadata
            queryKey={["metadata", event.pubkey]}
            pubkey={event.pubkey}
            let:metadata
          >
            <div slot="loading">
              <EventCard note={event} {depth} />
            </div>
            <div slot="nodata">
              <EventCard note={event} {depth} />
            </div>
            <div slot="error" let:error>
              <EventCard note={event} {depth} />
            </div>
            <EventCard note={event} {metadata} {depth} />
          </Metadata>
        </LatestEvent>
      {/if}
    {/await}
  {/if}
</div>
