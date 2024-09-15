<script lang="ts">
  import { _ } from "svelte-i18n";
  import Content from "../Note/Content.svelte";

  import BlockQuote from "./Simple/BlockQuote.svelte";
  import BulletList from "./Simple/BulletList.svelte";
  import CodeBlock from "./Simple/CodeBlock.svelte";
  import ListItem from "./Simple/ListItem.svelte";
  import Paragraph from "./Simple/Paragraph.svelte";
  import Heading from "./Simple/Heading.svelte";
  import Table from "./Simple/Table.svelte";
  import OrderedList from "./Simple/OrderedList.svelte";
  import type { Token } from "markdown-it/index.js";
  import Fence from "./Simple/Fence.svelte";
  import Inline from "./Simple/Inline.svelte";
  import Link from "./Simple/Link.svelte";
  import Image from "./Simple/Image.svelte";
  import Strong from "./Simple/Strong.svelte";
  import Strikethrough from "./Simple/Strikethrough.svelte";
  import TextMarkdown from "./Simple/TextMarkdown.svelte";
  import Em from "./Simple/Em.svelte";
  import CodeInline from "./Simple/CodeInline.svelte";
  import FootnoteRef from "./Simple/FootnoteRef.svelte";
  import FootnoteBlock from "./Simple/FootnoteBlock.svelte";
  export let part: Token;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  //ツイッターとかぶるすこも画像だけ拡大されて複数だったら横で次のやつ見れるようになってるらしい

  let imgError: boolean = false;
  let imgLoad: boolean = false;
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
  />
{:else if part.type === "hr"}
  <hr class="my-4" />
{:else if part.type === "paragraph"}
  <Paragraph
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
  <!---->
{:else if part.type === "code_block"}
  <CodeBlock {part} />{:else if part.type === "code_inline"}
  <CodeInline {part} />
  <!---->
{:else if part.type === "fence"}
  <Fence {part} />
  <!---->
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
  <!---->
{:else if part.type === "blockquote"}
  <BlockQuote
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
{:else if part.type === "ordered_list"}
  <OrderedList
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
  <!---->{:else if part.type === "bullet_list"}
  <BulletList
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
  <!---->{:else if part.type === "list_item"}
  <ListItem
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />{:else if part.type === "inline"}
  <Inline
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />{:else if part.type === "link"}
  <Link
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />{:else if part.type === "image"}
  <Image {part} />{:else if part.type === "strong"}
  <Strong
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />{:else if part.type === "s"}
  <Strikethrough
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
{:else if part.type === "text"}<Content
    text={part.content}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
  />{:else if part.type === "em"}<Em
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />{:else if part.type === "softbreak"}
  <!---->
{:else if part.type === "footnote_ref"}
  <FootnoteRef
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
{:else if part.type === "footnote_block"}
  <FootnoteBlock
    {part}
    {repostable}
    {depth}
    {displayMenu}
    {tags}
    {openModal}
    {nolist}
  />
{:else if part.type === "footnote"}
  {part.content}{:else if part.type === "footnote_anchor"}
  <a
    href="#footnote-ref-{part.meta.id}"
    id="footnote-def-{part.meta.id}"
    class="footnote-def mx-1">[{part.meta.id}]</a
  >
{:else}<b>{part.type}</b>
  <Content text={part.content} {repostable} {depth} {displayMenu} {tags} />
{/if}

<style lang="postcss">
  .footnote-def {
    text-decoration: underline;
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }

  .footnote-ref {
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
