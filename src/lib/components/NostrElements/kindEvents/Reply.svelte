<script lang="ts">
  import { Reply, Minimize2 } from "lucide-svelte";
  import Note from "./Note.svelte";
  import NaddrEvent from "./NaddrEvent.svelte";
  import { parseNaddr } from "$lib/func/util";
  import { _ } from "svelte-i18n";
  import { relayRegex } from "$lib/func/regex";
  import UrlDisplay from "../content/UrlDisplay.svelte";
  import type { Part } from "$lib/func/content";

  interface Props {
    replyTag: string[] | undefined;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
  }

  let { replyTag, displayMenu, depth, repostable, tieKey }: Props = $props();
  let loadNote = $state(false);

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
  {#if !loadNote}
    <button
      class="flex items-center w-fit px-1 py-0.5 max-w-full font-bold rounded-md text-sm bg-magnum-600 text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
      onclick={() => (loadNote = true)}
      ><Reply size="20" />{$_("timeline.viewParentPost")}</button
    >
  {:else}
    <button
      class="flex items-center w-fit px-1 py-0.5 rounded-md bg-magnum-200 text-sm font-bold text-magnum-600 hover:opacity-75 active:opacity-50 overflow-hidden max-w-full h-fit"
      onclick={() => (loadNote = false)}
      ><Minimize2 size="20" class="mr-1" />{$_(
        "timeline.hideParentPost"
      )}</button
    >
    <div class="border rounded-md border-magnum-600/30">
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
          depth={depth + 1}
          {repostable}
          {tieKey}
        />
      {:else if replyTag[0] === "a" || replyTag[0] === "A"}
        <!---->
        {@const naddr = parseNaddr(replyTag)}
        <NaddrEvent
          data={naddr}
          {displayMenu}
          depth={depth + 1}
          {tieKey}
          {repostable}
          content={undefined}
        />
      {:else if replyTag[0] === "I" || replyTag[0] === "i"}
        <!---->
        {#if replyTag[1].startsWith("http")}
          {@const part = toPart(replyTag)}
          <UrlDisplay {part} {openModal} />
        {:else}
          <!---->
          {replyTag.toString()}
        {/if}
      {:else}
        <!---->
        {replyTag.toString()}
      {/if}
    </div>
  {/if}
{/if}
