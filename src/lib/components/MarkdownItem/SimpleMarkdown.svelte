<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import SimpleContentBlock from "./SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import Truncate from "../NostrElements/content/Truncate.svelte";
  import { noteLink } from "$lib/func/event";
  import type * as Nostr from "nostr-typedef";

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

  // ライブラリ保持用
  let md: any = $state(null);

  // ライブラリを非同期でロード
  $effect(() => {
    async function initMarkdown() {
      const [
        { default: markdownit },
        { default: markdownItFootnote },
        { default: markdownItSub },
        { default: markdownItSup },
        { default: markdownItMark },
        { default: markdownTaskListPlugin },
        { default: markdownBrPlugin },
        { default: markdownDlPlugin },
        { default: markdownImgPlugin },
        { default: markdownLinkPlugin },
        { default: markdownDdPlugin },
        { default: markdownDtPlugin },
      ] = await Promise.all([
        import("markdown-it"),
        import("markdown-it-footnote"),
        import("markdown-it-sub"),
        import("markdown-it-sup"),
        import("markdown-it-mark"),
        import("$lib/func/markdown-it/markdown-it-tasklist"),
        import("$lib/func/markdown-it/markdown-it-br"),
        import("$lib/func/markdown-it/markdown-it-dl"),
        import("$lib/func/markdown-it/markdown-it-img"),
        import("$lib/func/markdown-it/markdown-it-link"),
        import("$lib/func/markdown-it/markdown-it-dd"), // タイポ修正
        import("$lib/func/markdown-it/markdown-it-dt"),
      ]);

      const parser = markdownit();

      parser.core.ruler.before(
        "normalize",
        "preserve_trailing_space",
        (state) => {
          if (!state.src) return;
          state.src = state.src.replace(/(?<=\S)( )(?=\n|$)/g, "\u00A0");
        },
      );

      parser
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
        .use(markdownDtPlugin);

      md = parser;
    }

    initMarkdown();
  });

  // md が準備でき、note.content がある場合にトークンを生成
  let tokens = $derived.by(() => {
    if (!md || !note?.content) return [];
    return md.parse(note.content, {});
  });

  // トークンからパーツを生成
  let parts = $derived(transformTokens(tokens));

  const openModal = (index: number) => {
    // modalIndex = index;
  };
</script>

<article class="contentBlock overflow-hidden">
  {#if md && parts.length > 0 && note}
    {#if maxHeight !== 0}
      <Truncate {maxHeight} {depth}>
        {#snippet truncate()}
          <a
            href={`/${noteLink(note)}`}
            class="h-8 flex items-center justify-center rounded-full border border-zinc-600 bg-zinc-800 px-4 font-medium leading-none text-zinc-200 w-full"
          >
            {$_("truncate.openpage")}
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
        {/each}
      </Truncate>
    {:else}
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
  {:else if !md}
    <div class="animate-pulse py-2">
      <div class="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
      <div class="h-4 bg-zinc-800 rounded w-1/2"></div>
    </div>
  {/if}
</article>
