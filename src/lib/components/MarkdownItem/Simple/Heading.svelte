<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";

  interface Props {
    part: Token;
    displayMenu: any;
    depth: any;
    repostable: any;
    tags: any;
    openModal: any;
    nolist: boolean;
    tieKey: string | undefined;
    zIndex?: number | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    tags,
    openModal,
    nolist,
    tieKey,
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
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
          {tags}
          {openModal}
          {nolist}
          {tieKey}
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
  /* .h1,
  .h2,
  .h3,
  .h4,
  .h5,
  .h6 {
    @apply font-serif p-4 bg-gray-100 shadow-lg rounded-lg;
  }

  .h1 {
    @apply text-4xl md:text-6xl mt-8 mb-6 text-magnum-600;
    border-left: 6px solid theme(colors.magnum.600);
  }

  .h2 {
    @apply text-3xl md:text-5xl mt-6 mb-4 text-magnum-500;
    border-left: 5px solid theme(colors.magnum.600);
  }

  .h3 {
    @apply text-2xl md:text-4xl mt-5 mb-3 text-magnum-400;
    border-left: 4px solid theme(colors.magnum.600);
  }

  .h4 {
    @apply text-xl md:text-2xl mt-5 mb-3 text-magnum-300;
  }

  .h5 {
    @apply text-lg md:text-xl mt-4 mb-2 text-magnum-200;
  }

  .h6 {
    @apply text-base md:text-lg mt-4 mb-2 text-magnum-100;
  } */
  /* .h1 {
    @apply font-semibold text-3xl md:text-5xl mt-6 mb-4 tracking-wide;
  }
  .h2 {
    @apply font-semibold text-2xl md:text-4xl mt-6 mb-4 tracking-wide;
  }
  .h3 {
    @apply font-semibold text-xl md:text-2xl mt-6 mb-4 tracking-wide;
  }
  .h4 {
    @apply font-semibold text-lg md:text-xl mt-6 mb-4 tracking-wide;
  }
  .h5 {
    @apply font-semibold text-base md:text-lg mt-6 mb-4 tracking-wide;
  }
  .h6 {
    @apply font-semibold text-sm md:text-base mt-6 mb-4 tracking-wide;
  } */
</style>
