<script lang="ts">
  import * as nip19 from "nostr-tools/nip19";

  import { parseNaddr, replaceText } from "$lib/func/util";
  import * as Nostr from "nostr-typedef";

  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import EllipsisMenuNaddr from "./NoteActionButtuns/EllipsisMenuNaddr.svelte";
  import { nip33Regex } from "$lib/func/regex";

  const contentLen = 40;

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
  <!-- {#if kind}
      {kind}
    {/if} -->

  <Text queryKey={["note", tag[1]]} id={tag[1]}>
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
      {@const replacedText = replaceText(text.content)}
      {replacedText.length < contentLen
        ? replacedText
        : `${replacedText.slice(0, contentLen)}...`}
      <!-- <div class="mx-2 text-sm">
        <Content
          event={{
            ...text,
            content:
              text.content.length < contentLen
                ? (text.content ?? "")
                : `${text.content.slice(0, contentLen)}...`,
          }}
          displayMenu={false}
          depth={0}
          repostable={false}
          isShowClientTag={false}
        />
      </div> -->
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

      {#snippet content({ event })}
        {@const replacedText = replaceText(event.content)}
        {replacedText.length < contentLen
          ? replacedText
          : `${replacedText.slice(0, contentLen)}...`}
        <!--  <Content
          event={{
            ...event,
            content:
              event.content.length < contentLen
                ? (event.content ?? "")
                : `${event.content.slice(0, contentLen)}...`,
          }}
          displayMenu={false}
          depth={0}
          repostable={false}
        /> -->
      {/snippet}
    </LatestEvent>
  {/if}
{/if}
