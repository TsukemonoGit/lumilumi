<script lang="ts">
  import { Reply, Minimize2 } from "lucide-svelte";
  import Note from "./Note.svelte";
  import NaddrEvent from "./NaddrEvent.svelte";
  import { parseNaddr } from "$lib/func/util";
  import { t as _ } from "@konemono/svelte5-i18n";
  import { relayRegex } from "$lib/func/regex";
  import UrlDisplay from "../content/UrlDisplay.svelte";
  import type { Token } from "@konemono/nostr-content-parser";
  import { onMount } from "svelte";

  interface Props {
    replyTag: string[] | undefined;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    zIndex?: number;
  }

  let { replyTag, displayMenu, depth, repostable, zIndex }: Props = $props();
  let loadNote = $state(false);
  let containerElement: HTMLElement | undefined = $state(undefined);

  const childZIndex = $derived(zIndex ? zIndex + 10 : 20);
  const noop = () => {};

  const createUrlToken = (url: string): Token => ({
    type: "url",
    content: url,
    start: 0,
    end: 0,
  });

  onMount(() => {
    if (!containerElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && loadNote) {
            loadNote = false;
          }
        });
      },
      { rootMargin: "200px" }
    );

    observer.observe(containerElement);
    return () => observer.disconnect();
  });
</script>

{#if replyTag}
  <div bind:this={containerElement}>
    {#if !loadNote}
      <button
        class="flex items-center w-fit px-1 py-0.5 max-w-full font-bold rounded-md text-sm bg-magnum-700 text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
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

      {#if replyTag[0] === "e" || replyTag[0] === "E"}
        {@const relayhint =
          replyTag && replyTag.length > 2 && relayRegex.test(replyTag[2])
            ? [replyTag[2]]
            : undefined}
        <Note
          className={"border rounded-md border-magnum-600/30"}
          {relayhint}
          id={replyTag[1]}
          mini={true}
          {displayMenu}
          depth={depth + 1}
          {repostable}
          zIndex={childZIndex}
        />
      {:else if replyTag[0] === "a" || replyTag[0] === "A"}
        {@const naddr = parseNaddr(replyTag)}
        <NaddrEvent
          className={"border rounded-md border-magnum-600/30"}
          data={naddr}
          {displayMenu}
          depth={depth + 1}
          {repostable}
          content={undefined}
          zIndex={childZIndex}
        />
      {:else if replyTag[0] === "I" || replyTag[0] === "i"}
        {#if replyTag[1].startsWith("http")}
          {@const part = createUrlToken(replyTag[1])}
          <UrlDisplay {part} openModal={noop} author={""} />
        {:else}
          {replyTag.toString()}
        {/if}
      {:else}
        {replyTag.toString()}
      {/if}
    {/if}
  </div>
{/if}
