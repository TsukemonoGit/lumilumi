<script lang="ts">
  import type { Token } from "markdown-it/index.js";
  import SimpleContentBlock from "../SimpleContentBlock.svelte";
  import { transformTokens } from "$lib/func/markdown";
  import NostrContent from "./NostrContent.svelte";

  import NotabPart from "./NotabPart.svelte";

  export let part: Token;
  export let displayMenu;
  export let depth;
  export let repostable;
  export let tags;
  export let openModal;
  export let nolist: boolean;
  export let tieKey: string | undefined;

  let children: Token[];
  $: if (part.children) {
    children = transformTokens(part.children);
    console.log(children);
  }
  $: console.log(part);
</script>

<dl>
  {#if part.children && children}
    {#each children as child}
      {#if child.type === "dd"}
        <dd>
          <NotabPart
            part={child}
            {repostable}
            {depth}
            {displayMenu}
            {tags}
            {openModal}
            {nolist}
            {tieKey}
          />
        </dd>
      {:else if child.type === "dt"}
        <dt>
          <NotabPart
            part={child}
            {repostable}
            {depth}
            {displayMenu}
            {tags}
            {openModal}
            {nolist}
            {tieKey}
          />
        </dt>
      {:else}
        <SimpleContentBlock
          part={child}
          {repostable}
          {depth}
          {displayMenu}
          {tags}
          {openModal}
          {nolist}
          {tieKey}
        />
      {/if}{/each}
  {:else}
    <NostrContent
      text={part.content}
      {repostable}
      {depth}
      {displayMenu}
      {tags}
      {tieKey}
    />
  {/if}
</dl>

<style>
  dl {
    margin: 1.5rem 0;
    padding: 0;
    font-family: Arial, sans-serif;
    line-height: 1.5;

    border-radius: 8px;
  }

  dt {
    font-weight: bold;
    margin-top: 1rem;

    border-radius: 4px;
  }

  dd {
    margin-left: 1rem;
    /*   padding-left: 0.5rem;*/

    font-size: 0.9rem;
  }

  /* オプション: <dl> 全体のスタイルを微調整 */
  dl > dt:first-child {
    margin-top: 0;
  }

  dl > dd:last-child {
    margin-bottom: 0;
  }
</style>
