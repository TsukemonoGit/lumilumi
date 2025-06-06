<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

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
  import CheckboxInput from "./Simple/CheckboxInput.svelte";
  import Label from "./Simple/Label.svelte";
  interface Props {
    part: Token;
    displayMenu: any;
    depth: any;
    repostable: any;
    tags: any;
    openModal: any;
    nolist: boolean;

    zIndex?: number | undefined;
  }

  let {
    part,
    displayMenu,
    depth,
    repostable,
    tags,
    openModal,
    nolist,

    zIndex,
  }: Props = $props();

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
    {zIndex}
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
    {zIndex}
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
      {zIndex}
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
    {zIndex}
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
    {zIndex}
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
    {zIndex}
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
      {zIndex}
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
    {zIndex}
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
      {zIndex}
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
      {zIndex}
    /></s
  >
{:else if part.type === "text"}
  <NostrContent
    text={part.content}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {zIndex}
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
      {zIndex}
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
    {zIndex}
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
      {zIndex}
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
    {zIndex}
  />
{:else if part.type === "checkbox_input"}
  <CheckboxInput {part} />
{:else if part.type === "label"}
  <Label
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
    {zIndex}
  />
{:else}<b>{part.type}</b>
  <NostrContent
    text={part.content}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {zIndex}
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
    border-radius: 1em;
    content: " ･ᴗ･ " !important;
    position: relative;
    padding: 0 8px 2px 8px;
    top: -0.7em;
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
