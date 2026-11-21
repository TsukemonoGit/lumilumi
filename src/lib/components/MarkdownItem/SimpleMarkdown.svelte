<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";
  import SimpleContentBlock from "./SimpleContentBlock.svelte";
  import { transformTokens } from "#lib/func/markdown.ts";
  import Truncate from "../NostrElements/content/Truncate.svelte";
  import { noteLink } from "#lib/func/event.ts";
  import type * as Nostr from "nostr-typedef";

  interface Props {
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    nolist?: boolean;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
    note: Nostr.Event;
    // ショーノート用: 00:00 形式のタイムスタンプをリンク化する
    podcastTimestamps?: boolean;
    breaks?: boolean; //通常の改行を改行扱いする
  }

  let {
    note,
    displayMenu,
    depth,
    repostable,
    nolist = false,
    maxHeight,
    zIndex = 0,
    podcastTimestamps = false,
    breaks = false,
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
        { default: markdownTimestampPlugin },
      ] = await Promise.all([
        import("markdown-it"),
        import("markdown-it-footnote"),
        import("markdown-it-sub"),
        import("markdown-it-sup"),
        import("markdown-it-mark"),
        import("#lib/func/markdown-it/markdown-it-tasklist.ts"),
        import("#lib/func/markdown-it/markdown-it-br.ts"),
        import("#lib/func/markdown-it/markdown-it-dl.ts"),
        import("#lib/func/markdown-it/markdown-it-img.ts"),
        import("#lib/func/markdown-it/markdown-it-link.ts"),
        import("#lib/func/markdown-it/markdown-it-dd.ts"), // タイポ修正
        import("#lib/func/markdown-it/markdown-it-dt.ts"),
        import("#lib/func/markdown-it/markdown-it-timestamp.ts"),
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

      // ポッドキャストのショーノートだけタイムスタンプをリンク化する
      if (podcastTimestamps) {
        parser.use(markdownTimestampPlugin);
      }

      md = parser;
    }

    initMarkdown();
  });

  // md が準備でき、note.content がある場合にトークンを生成
  let tokens = $derived.by(() => {
    if (!md || !note?.content) return [];

    const parsed = md.parse(note.content, {});
    if (breaks) {
      for (const token of parsed) {
        if (token.type !== "inline" || !token.children) continue;
        for (const child of token.children) {
          if (child.type === "softbreak") child.type = "hardbreak";
        }
      }
    }
    return parsed;
  });

  // トークンからパーツを生成
  let parts = $derived(transformTokens(tokens));
</script>

<article class="contentBlock overflow-hidden">
  {#if md && parts.length > 0 && note}
    {#if maxHeight !== 0}
      <Truncate {maxHeight} {depth} {zIndex} useDialog={false}>
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
