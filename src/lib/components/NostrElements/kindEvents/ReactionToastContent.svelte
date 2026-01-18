<!--ReactionToastContent.svelte-->
<script lang="ts">
  import * as nip19 from "nostr-tools/nip19";

  import { parseNaddr } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";

  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import { nip33Regex } from "$lib/func/regex";
  import { checkContentWarning, shortText } from "$lib/func/event";
  import { TriangleAlert } from "lucide-svelte";
  import ReactionToastWarningText from "$lib/components/Elements/ReactionToastWarningText.svelte";

  interface Props {
    //tagはaかe
    tag: string[];
  }

  let { tag }: Props = $props();
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

  function encodeNotehex(str: string): string {
    try {
      return nip19.noteEncode(str);
    } catch (error) {
      return str;
    }
  }
</script>

{#if tag[0] === "e"}
  {@const loadingText = encodeNotehex(tag[1])}
  <Text id={tag[1]}>
    {#snippet loading()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        Loading {loadingText}<EllipsisMenuNote encodedId={loadingText} />
      </div>
    {/snippet}
    {#snippet nodata()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        nodata {loadingText}<EllipsisMenuNote encodedId={loadingText} />
      </div>
    {/snippet}
    {#snippet error()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {loadingText}<EllipsisMenuNote encodedId={loadingText} />
      </div>
    {/snippet}
    {#snippet content({ data: text })}
      {@const warning = checkContentWarning(text.tags)}
      {#if warning}
        <ReactionToastWarningText />
      {:else}
        {shortText(text.content)}
      {/if}
    {/snippet}
  </Text>
{:else if tag[0] === "a"}
  {@const filter = naddrFilter()}
  {@const encodedNaddr = encodeNaddr(tag)}
  {#if filter}
    <LatestEvent filters={[filter]} queryKey={["naddr", tag[1]]}>
      {#snippet loading()}
        <div>
          Loading {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>
          nodata {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
        </div>
      {/snippet}
      {#snippet error()}
        <div>
          {tag[1]}<EllipsisMenuNaddr naddr={encodedNaddr} />
        </div>
      {/snippet}

      {#snippet success({ event })}
        {@const warning = checkContentWarning(event.tags)}
        {#if warning}
          <ReactionToastWarningText />
        {:else}
          {shortText(event.content)}
        {/if}
      {/snippet}
    </LatestEvent>
  {/if}
{/if}
