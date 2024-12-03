<script lang="ts">
  import { _ } from "svelte-i18n";
  import SimpleContentBlock from "./SimpleContentBlock.svelte";
  import markdownit from "markdown-it";
  import { transformTokens } from "$lib/func/markdown";
  import markdownItFootnote from "markdown-it-footnote";
  import markdownItSub from "markdown-it-sub";
  import markdownItSup from "markdown-it-sup";
  import markdownItMark from "markdown-it-mark";
  import markdownBrPlugin from "$lib/func/markdown-it/markdown-it-br";
  import markdownDlPlugin from "$lib/func/markdown-it/markdown-it-dl";
  import markdownImgPlugin from "$lib/func/markdown-it/markdown-it-img";
  import markdownLinkPlugin from "$lib/func/markdown-it/markdown-it-link";
  import markdownDdPlugin from "$lib/func/markdown-it/markdonw-it-dd";
  import markdownDtPlugin from "$lib/func/markdown-it/markdown-it-dt";

  interface Props {
    text: string;
    tags: string[][];
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    nolist?: boolean;
    tieKey: string | undefined;
  }

  let {
    text,
    tags,
    displayMenu,
    depth,
    repostable,
    nolist = false,
    tieKey
  }: Props = $props();

  const md = markdownit();

  //プレビューにも使ってるからconstだとだめ
  let tokens = $derived(md

    .use(markdownImgPlugin)

    .use(markdownItFootnote)
    .use(markdownItSub)
    .use(markdownItSup)
    .use(markdownItMark)
    .use(markdownBrPlugin)
    .use(markdownLinkPlugin)
    .use(markdownDlPlugin)
    .use(markdownDdPlugin)
    .use(markdownDtPlugin)
    .parse(text, {}));
  let parts = $derived(transformTokens(tokens));

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
<article class="contentBlock overflow-hidden">
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
        {tieKey}
      />
    {/each}
  {/if}
</article>
