<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
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

  import Truncate from "../NostrElements/content/Truncate.svelte";
  //import Dialog from "../Elements/Dialog.svelte";
  //import { type Writable, writable } from "svelte/store";
  import * as Nostr from "nostr-typedef";

  import { noteLink } from "$lib/func/event";
  import markdownTaskListPlugin from "$lib/func/markdown-it/markdown-it-tasklist";

  interface Props {
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    nolist?: boolean;

    maxHeight?: number | undefined;
    zIndex?: number | undefined;
    note: Nostr.Event;
  }

  let {
    note,

    displayMenu,
    depth,
    repostable,
    nolist = false,

    maxHeight,
    zIndex = 0,
  }: Props = $props();

  const md = markdownit();
  md.core.ruler.before("normalize", "preserve_trailing_space", (state) => {
    if (!state.src) return;

    // 行末のスペース1個をNBSPに変換（Markdown構文に影響しないよう注意）
    state.src = state.src.replace(/(?<=\S)( )(?=\n|$)/g, "\u00A0");
  });

  //プレビューにも使ってるからconstだとだめ
  let tokens = $derived(
    md
      .use(markdownTaskListPlugin)
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

      .parse(note.content, {})
  );
  let parts = $derived(transformTokens(tokens));

  //let modalIndex = 0;
  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    // $viewMediaModal = { index: index, mediaList: mediaList };
  };

  // svelte-ignore non_reactive_update
  /*  let showMore: Writable<boolean> = writable(false);
  const onClickShowMore = () => {
    console.log("showMore");
    $showMore = true;
  }; */
</script>

<article class="contentBlock overflow-hidden">
  {#if parts && note}
    {#if maxHeight !== 0}
      <Truncate {maxHeight} {depth}>
        {#snippet truncate()}
          <a
            href={`/${noteLink(note)}`}
            class="h-8 flex items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
            >{$_("truncate.openpage")}
          </a>
        {/snippet}
        {#each parts as token}
          <SimpleContentBlock
            part={token}
            {repostable}
            {depth}
            {displayMenu}
            {note}
            {nolist}
            {zIndex}
          />
        {/each}</Truncate
      >{:else}
      {#each parts as token}
        <SimpleContentBlock
          {note}
          part={token}
          {repostable}
          {depth}
          {displayMenu}
          {nolist}
          {zIndex}
        />
      {/each}
    {/if}
  {/if}
</article>
