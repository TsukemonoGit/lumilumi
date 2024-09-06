<script lang="ts">
  import { parseOrderedList, type Part } from "$lib/func/content";
  import Markdown from "./Markdown.svelte";

  export let part: Part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  //console.log(part);
  // const list = part?.content ? parseOrderedList(part?.content ?? "") : [];
  // console.log(list);
</script>

{#if part.headers && part.headers.length > 0}
  <ol>
    {#each part.headers as li}
      {#if li}
        <li>
          <Markdown text={li ?? ""} {tags} {displayMenu} {depth} {repostable} />
        </li>
      {/if}
    {/each}
  </ol>
{/if}
