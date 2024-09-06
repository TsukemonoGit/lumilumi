<script lang="ts">
  import type { Part } from "$lib/func/content";
  import ContentBlock from "./ContentBlock.svelte";
  import Markdown from "./Markdown.svelte";

  export let part: Part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  //$: console.log(part);
</script>

{#if part.headers && part.headers.length > 0}
  <ul>
    {#each part.headers as li}
      {#if li}
        <li>
          <Markdown text={li ?? ""} {tags} {displayMenu} {depth} {repostable} />
        </li>
      {/if}
    {/each}
  </ul>
{/if}
