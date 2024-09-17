<script lang="ts">
  import { nip19 } from "nostr-tools";

  import { nip33Regex, parseNaddr } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";

  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import Content from "./Content.svelte";

  //tagはaかe
  export let tag: string[];

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
    <div class="mx-2 text-sm">
      <Content
        text={text.content.length < 40
          ? (text.content ?? "")
          : `${text.content.slice(0, 40)}...`}
        tags={text.tags}
        displayMenu={false}
        depth={0}
        repostable={false}
      />
    </div>
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

      <Content
        text={event.content.length < 50
          ? (event.content ?? "")
          : `${event.content.slice(0, 50)}...`}
        tags={event.tags}
        displayMenu={false}
        depth={0}
        repostable={false}
      />
    </LatestEvent>
  {/if}
{/if}
