<script lang="ts">
  import { nip19 } from "nostr-tools";

  import { nip33Regex, parseNaddr } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";
  import EventCard from "./EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  export let displayMenu: boolean;
  export let repostable: boolean;
  export let maxHeight: string;
  //tagはaかe
  export let tag: string[];
  //export let kind: number | undefined;
  export let depth: number;
  export let tieKey: string | undefined;

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

  const encodeNaddr = (tag: string[]) => {
    const address = parseNaddr(tag);
    try {
      return nip19.naddrEncode(address);
    } catch (error) {
      return undefined;
    }
  };
</script>

{#if tag[0] === "e"}
  <!-- {#if kind}
      {kind}
    {/if} -->

  <Text queryKey={["timeline", tag[1]]} id={tag[1]} let:text>
    <div
      slot="loading"
      class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
    >
      Loading {nip19.noteEncode(tag[1])}<EllipsisMenuNote
        notestr={nip19.noteEncode(tag[1])}
      />
    </div>
    <div
      slot="nodata"
      class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
    >
      nodata {nip19.noteEncode(tag[1])}<EllipsisMenuNote
        notestr={nip19.noteEncode(tag[1])}
      />
    </div>
    <div
      slot="error"
      class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      let:error
    >
      {nip19.noteEncode(tag[1])}<EllipsisMenuNote
        notestr={nip19.noteEncode(tag[1])}
      />
    </div>
    <Metadata
      queryKey={["metadata", text.pubkey]}
      pubkey={text.pubkey}
      let:metadata
    >
      <div slot="loading">
        <EventCard
          note={text}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
        />
      </div>
      <div slot="nodata">
        <EventCard
          note={text}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
        />
      </div>
      <div slot="error" let:error>
        <EventCard
          note={text}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
        />
      </div>
      <EventCard
        note={text}
        {metadata}
        {depth}
        {repostable}
        {maxHeight}
        {displayMenu}
        {tieKey}
      />
    </Metadata>
  </Text>
{:else if tag[0] === "a"}
  {@const filter = naddrFilter()}
  {@const encodedNaddr = encodeNaddr(tag)}
  {#if filter}
    <LatestEvent filters={[filter]} queryKey={["naddr", tag[1]]} let:event>
      <div slot="loading">
        Loading {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
      </div>
      <div slot="nodata">
        nodata {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
      </div>
      <div slot="error" let:error>
        {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
      </div>
      <Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
        let:metadata
      >
        <div slot="loading" class="w-full">
          <EventCard
            note={event}
            {depth}
            {repostable}
            {maxHeight}
            {displayMenu}
            {tieKey}
          />
        </div>
        <div slot="nodata" class="w-full">
          <EventCard
            note={event}
            {depth}
            {repostable}
            {maxHeight}
            {displayMenu}
            {tieKey}
          />
        </div>
        <div slot="error" class="w-full" let:error>
          <EventCard
            note={event}
            {depth}
            {repostable}
            {maxHeight}
            {displayMenu}
            {tieKey}
          />
        </div>
        <EventCard
          note={event}
          {metadata}
          {depth}
          {repostable}
          {maxHeight}
          {displayMenu}
          {tieKey}
        />
      </Metadata>
    </LatestEvent>
  {/if}
{/if}
