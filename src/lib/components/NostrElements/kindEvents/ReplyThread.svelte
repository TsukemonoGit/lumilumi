<script lang="ts">
  import type { Part } from "$lib/func/content";
  import { relayRegex } from "$lib/func/regex";
  import { parseNaddr } from "$lib/func/util";
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
  const toPart = (tag: string[]): Part => {
    return {
      type: "url",
      url: tag[1],
      content: tag[1],
    };
  };
</script>

{#if replyTag}
  {#if replyTag[0] === "e" || replyTag[0] === "E"}
    {@const relayhint =
      replyTag && replyTag.length > 2 && relayRegex.test(replyTag[2])
        ? [replyTag[2]]
        : undefined}
    <Note
      {relayhint}
      id={replyTag[1]}
      mini={true}
      {displayMenu}
      thread={true}
      depth={depth + 1}
      {repostable}
    />
  {:else if replyTag[0] === "a" || replyTag[0] === "A"}
    <!---->
    {@const naddr = parseNaddr(replyTag)}
    <NaddrEvent
      data={naddr}
      {displayMenu}
      {depth}
      {repostable}
      content={replyTag[1]}
      mini={true}
      thread={true}
    />
  {:else if replyTag[0] === "I" || replyTag[0] === "i"}
    <!---->
    {#if replyTag[1].startsWith("http")}
      {@const part = toPart(replyTag)}
      <UrlDisplay {part} {openModal} />
    {:else}
      <!---->
      {replyTag[1]}
    {/if}
  {:else}
    <!---->
    {replyTag[1]}
  {/if}
{/if}
