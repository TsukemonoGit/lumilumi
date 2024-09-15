<script lang="ts">
  import { parseMarkdownText } from "$lib/func/content";
  import { viewMediaModal } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";
  import ContentBlock from "./ContentBlock.svelte";
  import SimpleContentBlock from "./SimpleContentBlock.svelte";
  import markdownit from "markdown-it";
  import Content from "../Note/Content.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import markdownItFootnote from "markdown-it-footnote";
  export let text: string;
  export let tags: string[][];
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let nolist: boolean = false;

  const md = markdownit();

  //プレビューにも使ってるからconstだとだめ
  $: tokens = md.use(markdownItFootnote).parse(text, {});
  $: parts = transformTokens(tokens);

  //let modalIndex = 0;
  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    // $viewMediaModal = { index: index, mediaList: mediaList };
  };
</script>

<!-- <MediaDisplay
  bind:open={showModal}
  images={mediaList}
  bind:currentIndex={modalIndex}
/> -->
<article>
  {#if parts}
    {#each parts as token}
      <SimpleContentBlock
        part={token}
        {repostable}
        {depth}
        {displayMenu}
        {tags}
        {openModal}
        {nolist}
      />
    {/each}
  {/if}
</article>
