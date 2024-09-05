<script lang="ts">
  import type { Part } from "$lib/func/content";
  import { showImg, viewMediaModal } from "$lib/stores/stores";
  import { _ } from "svelte-i18n";
  import Content from "../Content.svelte";
  import DecodedContent from "../DecodedContent.svelte";
  import { nip19Decode } from "$lib/func/util";
  import Link from "$lib/components/Elements/Link.svelte";
  import UnorderedList from "./UnorderedList.svelte";
  import Table from "./Table.svelte";
  import Markdown from "./Markdown.svelte";
  import { ExternalLink } from "lucide-svelte";

  export let part: Part;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;

  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい

  let imgError: boolean = false;
  let imgLoad: boolean = false;
</script>

{#if part.type === "nip19"}
  {@const decoded = nip19Decode(part.url)}
  {#if decoded}
    <DecodedContent
      {decoded}
      content={part.content}
      {displayMenu}
      depth={depth + 1}
      {repostable}
    />{:else}{part.content}{/if}
{:else if part.type === "horizontal"}<hr />{:else if part.type === "codeBlock"}
  <pre><code>{part.content}</code></pre>{:else if part.type === "quote"}
  <blockquote>
    <Content
      text={part.content ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    />
  </blockquote>{:else if part.type === "unorderedList"}
  <UnorderedList {part} {tags} {displayMenu} {depth} {repostable} {openModal} />
{:else if part.type === "table"}
  <Table {part} {tags} {displayMenu} {depth} {repostable} />
{:else if part.type === "italic"}
  <em
    ><Markdown
      text={part.content ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    /></em
  >
{:else if part.type === "bold"}
  <b
    ><Markdown
      text={part.content ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    /></b
  >
{:else if part.type === "header" && part.number}
  <div class="header-{part.number} mt-4">
    <Markdown
      text={part.content ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    />
  </div>
{:else if part.type === "imageLink" && part.url}
  <Link
    props={{ "aria-label": `External Links: ${part.url}` }}
    className="hover:opacity-70 flex underline text-magnum-300 break-all "
    href={part.url}
  >
    {#if $showImg && !imgError}
      {#if !imgLoad}{part.content}{/if}
      <div class="w-fit h-fit">
        <img
          loading="lazy"
          width="288"
          height="288"
          alt="img"
          src={part.imageUrl}
          class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
          on:load={() => (imgLoad = true)}
          on:error={() => (imgError = true)}
        />
      </div>{:else}{part.content}{/if}<ExternalLink size={20} /></Link
  >
{:else if part.type === "image" && part.url}
  {#if $showImg && !imgError}
    {#if !imgLoad}<Link
        props={{ "aria-label": `External Links: ${part.url}` }}
        className="underline text-magnum-300 break-all "
        href={part.url}>{part.content ?? part.url}</Link
      >{/if}
    <div>
      <button
        class="w-fit h-fit"
        aria-label={$_("alia.label.image")}
        on:click={() => openModal(part.number ?? 0)}
        ><img
          loading="lazy"
          width="288"
          height="288"
          alt="img"
          src={part.url}
          class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
          on:load={() => (imgLoad = true)}
          on:error={() => (imgError = true)}
        /></button
      >
    </div>{:else}<Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all "
      href={part.url}>{part.content}</Link
    >{/if}
{:else if part.type === "movie"}
  {#if $showImg}
    <video
      aria-label="video contents"
      controls
      src={part.url}
      class=" object-contain max-w-[min(20rem,100%)] max-h-80"
      ><track default kind="captions" /></video
    >
  {:else}<Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all "
      href={part.url ?? ""}>{part.content}</Link
    >{/if}{:else if part.type === "audio"}
  {#if $showImg}
    <audio
      aria-label="audio contents"
      controls
      src={part.url}
      class=" object-contain max-w-[min(20rem,100%)] max-h-80"
      ><track default kind="captions" /></audio
    >
  {:else}<Link
      props={{ "aria-label": `External Links: ${part.url}` }}
      className="underline text-magnum-300 break-all "
      href={part.url ?? ""}>{part.content}</Link
    >{/if}
{:else if part.type === "url"}<Link
    props={{ "aria-label": `External Links: ${part.url}` }}
    className="underline text-magnum-300 break-all "
    href={part.url ?? ""}
    ><Markdown
      text={part.content ?? part.url ?? ""}
      {tags}
      {displayMenu}
      {depth}
      {repostable}
    /></Link
  >{:else if part.type === "emoji"}
  {#if $showImg && !imgError}{#if !imgLoad}:{part.content}:{/if}<img
      height="24"
      loading="lazy"
      alt={`:${part.content}:`}
      src={part.url}
      title={`:${part.content}:`}
      class="inline h-[24px] object-contain m-0 overflow-hidden"
      on:load={() => (imgLoad = true)}
      on:error={() => (imgError = true)}
    />{:else}:{part.content}:{/if}
{:else if part.type === "hashtag"}
  <a
    aria-label={"Search for events containing the hashtag"}
    href={`/search?t=${part.url}`}
    class="underline text-magnum-300 break-all">#{part.content}</a
  >
{:else if part.type === "nip"}
  <Link
    props={{ "aria-label": `External Links: ${part.url}` }}
    className="underline text-magnum-300 break-all"
    href={part.url ?? ""}>{part.content}</Link
  >{:else}
  <Content
    text={part.content ?? ""}
    {tags}
    {displayMenu}
    {depth}
    {repostable}
  />
{/if}

<style lang="postcss">
  .header-1 {
    @apply text-3xl font-bold mb-4;
  }

  .header-2 {
    @apply text-2xl font-semibold mb-4;
  }

  .header-3 {
    @apply text-xl font-semibold mb-3;
  }

  .header-4 {
    @apply text-lg font-semibold mb-2;
  }
  .header-5 {
    @apply text-lg font-medium mb-2;
  }
  blockquote {
    padding: 1em;
    margin: 1em 0;
    border-left: 5px solid rgb(var(--color-magnum-500) / 1); /* 引用の左側にカラーテーマに基づくライン */
    background-color: rgb(
      var(--color-neutral-800) / 1
    ); /* 背景色をカラーテーマに基づく */
    color: rgb(
      var(--color-neutral-50) / 1
    ); /* テキスト色をカラーテーマに基づく */
    font-style: italic;
    quotes: "“" "”" "‘" "’";
  }

  blockquote::before {
    content: open-quote;
    font-size: 2em;
    color: rgb(var(--color-magnum-500) / 1); /* カラーテーマに基づく */
    margin-right: 0.25em;
  }

  blockquote::after {
    content: close-quote;
  }
  /* コードブロック全体のスタイル */
  pre {
    background-color: theme(colors.neutral.800); /* ダークテーマ背景色 */
    border-radius: 8px; /* 角を丸くする */
    padding: 8px 16px; /* 内側に余白を作る */

    font-family: "Courier New", Courier, monospace; /* 等幅フォントを使用 */
    margin: 1em 0;
    @apply whitespace-pre-wrap break-words overflow-x-auto;
    word-break: break-word;
  }

  /* コード内のスタイル */
  code {
    color: theme(colors.neutral.100); /* コードの文字色（明るめの白色） */
    font-size: 14px; /* 文字サイズを調整 */
  }
</style>
