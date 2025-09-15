<script lang="ts">
  //import type { Part } from "$lib/func/content";
  import { relayRegex } from "$lib/func/regex";
  import { parseNaddr } from "$lib/func/util";
  import type { Token } from "@konemono/nostr-content-parser";
  import UrlDisplay from "../content/UrlDisplay.svelte";
  import NaddrEvent from "./NaddrEvent.svelte";
  import Note from "./Note.svelte";

  interface Props {
    replyTag: string[] | undefined;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
  }

  let { replyTag, displayMenu, depth, repostable }: Props = $props();

  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    // $viewMediaModal = { index: index, mediaList: mediaList };
  };
  const toPart = (tag: string[]): Token => {
    return {
      type: "url",

      content: tag[1],
      start: 0,
      end: 0,
    };
  };
</script>

{#if replyTag}
  {@const [tagName, id, relay, marker] = replyTag}
  {#if tagName === "e" || tagName === "E"}
    {@const relayhint = relay && relayRegex.test(relay) ? [relay] : undefined}
    <Note
      {relayhint}
      {id}
      mini={true}
      {displayMenu}
      thread={true}
      depth={depth + 1}
      {repostable}
    />
  {:else if tagName === "a" || tagName === "A"}
    <!---->
    {@const naddr = parseNaddr(replyTag)}
    <NaddrEvent
      data={naddr}
      {displayMenu}
      {depth}
      {repostable}
      content={id}
      mini={true}
      thread={true}
    />
  {:else if tagName === "I" || tagName === "i"}
    <!---->
    {#if id.startsWith("http")}
      {@const part = toPart(replyTag)}
      <UrlDisplay {part} {openModal} author={""} />
    {:else}
      <!---->
      {id}
    {/if}
  {:else}
    <!---->
    {id}
  {/if}
{/if}
