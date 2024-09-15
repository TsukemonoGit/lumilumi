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
    // console.log("[footnoteBlock]", children);
  }
</script>

{#if children}
  <hr class=" my-2" />
  <div class="text-lg font-bold my-2">Footnotes</div>
  <ul>
    {#each children as child}
      <li>
        {#if child.children}
          {#each transformTokens(child.children) as child2}
            {#if child2.type !== "footnote_anchor"}
              <SimpleContentBlock
                part={child2}
                {repostable}
                {depth}
                {displayMenu}
                {tags}
                {openModal}
                {nolist}
              />{:else}
              <a
                href="#footnote-ref-{child2.meta.id}"
                id="footnote-def-{child2.meta.id}"
                class="footnote-def mx-1">[{child2.meta.id}]</a
              >{/if}{/each}
        {:else}
          <Content
            text={part.content}
            {repostable}
            {depth}
            {displayMenu}
            {tags}
          />
        {/if}
      </li>{/each}
  </ul>{/if}

<style lang="postcss">
  .footnote-def {
    text-decoration: underline;
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }

  .footnote-ref {
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
