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
  import markdownCheckBoxPlugin from "markdown-it-task-checkbox";
  import Truncate from "../NostrElements/content/Truncate.svelte";
  import Dialog from "../Elements/Dialog.svelte";
  import { type Writable, writable } from "svelte/store";
  import * as Nostr from "nostr-typedef";
  import { goto } from "$app/navigation";
  import { noteLink } from "$lib/func/event";

  interface Props {
    text: string;
    tags: string[][];
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    nolist?: boolean;
    tieKey: string | undefined;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
    note?: Nostr.Event;
  }

  let {
    text,
    note,
    tags,
    displayMenu,
    depth,
    repostable,
    nolist = false,
    tieKey,
    maxHeight,
    zIndex = 0,
  }: Props = $props();

  const md = markdownit();

  //プレビューにも使ってるからconstだとだめ
  let tokens = $derived(
    md
      .use(markdownCheckBoxPlugin)
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
      .parse(text, {})
  );
  let parts = $derived(transformTokens(tokens));

  //let modalIndex = 0;
  const openModal = (index: number) => {
    // modalIndex = index;
    // if (showModal) $showModal = true;
    // $viewMediaModal = { index: index, mediaList: mediaList };
  };

  // svelte-ignore non_reactive_update
  let showMore: Writable<boolean> = writable(false);
  const onClickShowMore = () => {
    console.log("showMore");
    $showMore = true;
  };
  const onClickShowPage = () => {
    if (note) {
      goto(`/${noteLink(note, tieKey)}`);
    }
  };
</script>

<article class="contentBlock overflow-hidden">
  {#if parts}
    {#if maxHeight !== 0}
      <Truncate {maxHeight} {depth} {onClickShowMore}>
        {#snippet truncate()}
          {#if !note}
            <button
              onclick={onClickShowMore}
              class="h-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
            >
              Show More
            </button>{:else}
            <button
              onclick={onClickShowPage}
              class="h-8 items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
            >
              Read more
            </button>{/if}
        {/snippet}
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
            {zIndex}
          />
        {/each}</Truncate
      >{:else}
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
          {zIndex}
        />
      {/each}
    {/if}
  {/if}
</article>
<!--Show more no Dialog-->
<Dialog
  bind:open={showMore}
  zIndex={zIndex + 10}
  id={`showMore_${text.slice(10)}_${depth}}`}
>
  {#snippet main()}
    <div
      class="contentBlock rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden"
    >
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
          {zIndex}
        />
      {/each}
    </div>
  {/snippet}</Dialog
>
