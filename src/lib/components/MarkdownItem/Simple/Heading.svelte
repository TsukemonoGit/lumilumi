<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import * as Nostr from "nostr-typedef";

  interface Props {
    part: Token;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    note: Nostr.Event;

    nolist: boolean;

    zIndex?: number | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    note,

    nolist,

    zIndex,
  }: Props = $props();

  let children: Token[] = $derived(transformTokens(part.children ?? []));
</script>

{#if part.children && children}
  {#if part.tag === "h1"}
    <h1 class="h1">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/each}
    </h1>
  {:else if part.tag === "h2"}
    <h2 class="h2">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/each}
    </h2>
  {:else if part.tag === "h3"}
    <h3 class="h3">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/each}
    </h3>
  {:else if part.tag === "h4"}
    <h4 class="h4">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/each}
    </h4>
  {:else if part.tag === "h5"}
    <h5 class="h5">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/each}
    </h5>
  {:else if part.tag === "h6"}
    <h6 class="h6">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {note}
          {nolist}
          {zIndex}
        />
      {/each}
    </h6>
  {/if}
{/if}

<style lang="postcss">
  .h1,
  .h2,
  .h3,
  .h4,
  .h5,
  .h6 {
    @apply font-title tracking-wide  mt-8 mb-6  py-1.5;
    line-height: 1em;
  }
  .h1,
  .h2 {
    @apply border-b border-neutral-200;
  }
  .h1 {
    font-size: 2em;
    font-weight: 600;
  }

  .h2 {
    font-size: 1.8em;
    font-weight: 600;
  }

  .h3 {
    font-size: 1.6em;
    font-weight: 600;
  }

  .h4 {
    font-size: 1.4em;
    font-weight: 600;
  }

  .h5 {
    font-size: 1.2em;
    font-weight: 600;
  }

  .h6 {
    /* @apply text-base  mt-4 mb-2 font-bold; */
    font-size: 1em;
    font-weight: 600;
  }
</style>
