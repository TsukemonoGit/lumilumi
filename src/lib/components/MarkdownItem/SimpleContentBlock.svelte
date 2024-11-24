<script lang="ts">
  import { _ } from "svelte-i18n";

  import BulletList from "./Simple/BulletList.svelte";
  import CodeBlock from "./Simple/CodeBlock.svelte";
  import ListItem from "./Simple/ListItem.svelte";
  import Paragraph from "./Simple/Paragraph.svelte";
  import Heading from "./Simple/Heading.svelte";
  import Table from "./Simple/Table.svelte";
  import OrderedList from "./Simple/OrderedList.svelte";
  import type { Token } from "markdown-it/index.js";
  import Fence from "./Simple/Fence.svelte";
  import Link from "./Simple/Link.svelte";
  import Image from "./Simple/Image.svelte";
  import CodeInline from "./Simple/CodeInline.svelte";
  import FootnoteRef from "./Simple/FootnoteRef.svelte";
  import FootnoteBlock from "./Simple/FootnoteBlock.svelte";
  import NostrContent from "./Simple/NostrContent.svelte";
  import Dl from "./Simple/Dl.svelte";
  import NotabPart from "./Simple/NotabPart.svelte";
  export let part: Token;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  export let tieKey: string | undefined;
  // if (part.type === "hr") {
  //   console.log(part);
  // }
</script>

{#if part.type === "heading"}
  <Heading
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "hr"}
  <hr class="my-6" />
{:else if part.type === "paragraph"}
  <Paragraph
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
  <!---->
{:else if part.type === "code_block"}
  <CodeBlock {part} />
{:else if part.type === "code_inline"}
  <CodeInline {part} />
{:else if part.type === "fence"}
  <Fence {part} />
{:else if part.type === "table"}
  <Table
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "blockquote"}
  <blockquote>
    <NotabPart
      {part}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {openModal}
      {nolist}
      {tieKey}
    />
  </blockquote>
{:else if part.type === "ordered_list"}
  <OrderedList
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "bullet_list"}
  <BulletList
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "list_item"}
  <ListItem
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "inline"}
  <span>
    <NotabPart
      {part}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {openModal}
      {nolist}
      {tieKey}
    /></span
  >
{:else if part.type === "link"}
  <Link
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "image"}
  <Image {part} />
{:else if part.type === "strong"}
  <strong>
    <NotabPart
      {part}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {openModal}
      {nolist}
      {tieKey}
    /></strong
  >
{:else if part.type === "s"}
  <s>
    <NotabPart
      {part}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {openModal}
      {nolist}
      {tieKey}
    /></s
  >
{:else if part.type === "text"}
  <NostrContent
    text={part.content}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {tieKey}
  />
{:else if part.type === "em"}
  <em class="italic">
    <NotabPart
      {part}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {openModal}
      {nolist}
      {tieKey}
    /></em
  >
{:else if part.type === "softbreak"}
  <!---->
{:else if part.type === "footnote_ref"}
  <FootnoteRef {part} />
{:else if part.type === "footnote_block"}
  <FootnoteBlock
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else if part.type === "footnote"}
  {part.content}
{:else if part.type === "footnote_anchor"}
  <a
    href="#footnote-ref-{part.meta.id}"
    id="footnote-def-{part.meta.id}"
    class="footnote-def mx-1">[{part.meta.id}]</a
  >
{:else if part.type === "sub"}
  <sub>{part.content}</sub>
{:else if part.type === "sup"}
  <sup>{part.content}</sup>
{:else if part.type === "mark"}
  <mark>
    <NotabPart
      {part}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {openModal}
      {nolist}
      {tieKey}
    /></mark
  >
{:else if part.type === "hardbreak"}
  <br />
{:else if part.type === "dl"}
  <Dl
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {tieKey}
  />
{:else}<b>{part.type}</b>
  <NostrContent
    text={part.content}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {tieKey}
  />
{/if}

<style lang="postcss">
  .footnote-def {
    text-decoration: underline;
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
  hr {
    overflow: visible;
    text-align: center;
  }
  hr::after {
    background: theme(colors.neutral.900);
    color: rgb(var(--color-magnum-100) / 0.5);
    content: " ･ᴗ･ " !important;
    position: relative;
    padding: 0 4px;
    top: -13px;
  }

  blockquote {
    padding: 0.1em 1.5em;
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
    line-height: 1.5;
    /* position: relative; 擬似要素の位置を調整するために必要 */
  }
</style>
