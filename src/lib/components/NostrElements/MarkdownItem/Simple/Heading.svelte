<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import Content from "../../Note/Content.svelte";
  import { transformTokens } from "$lib/func/markdown";

  export let part: Token;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  let children: Token[];
  $: if (part.children) {
    children = transformTokens(part.children);
    // console.log(children);
  }
</script>

{#if part.children && children}
  {#if part.tag === "h1"}
    <h1 class="text-3xl font-semibold leading-normal tracking-normal my-3">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/each}
    </h1>
  {:else if part.tag === "h2"}
    <h2 class="text-2xl font-medium leading-normal tracking-normal my-3">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/each}
    </h2>
  {:else if part.tag === "h3"}
    <h3 class="text-xl font-medium leading-relaxed tracking-normal my-2">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/each}
    </h3>
  {:else if part.tag === "h4"}
    <h4 class="text-lg font-normal leading-relaxed tracking-normal my-2">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/each}
    </h4>
  {:else if part.tag === "h5"}
    <h5 class="text-base font-normal leading-relaxed tracking-wide my-2">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/each}
    </h5>
  {:else if part.tag === "h6"}
    <h6 class="text-sm font-light leading-relaxed tracking-wide my-1">
      {#each children as child}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
        />
      {/each}
    </h6>
  {/if}
{/if}
