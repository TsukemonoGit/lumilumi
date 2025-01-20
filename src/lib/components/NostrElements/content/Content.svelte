<script lang="ts">
  import { _ } from "svelte-i18n";

  import Truncate from "./Truncate.svelte";
  import ContentParts from "./ContentParts.svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import { writable, type Writable } from "svelte/store";

  interface Props {
    text: string;
    tags: string[][];
    displayMenu: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    isShowClientTag?: boolean;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
  }

  let {
    text,
    tags,
    displayMenu,
    depth,
    repostable,
    tieKey,
    isShowClientTag,
    maxHeight,
    zIndex = 0,
  }: Props = $props();

  // svelte-ignore non_reactive_update
  let showMore: Writable<boolean> = writable(false);

  const onClickShowMore = () => {
    console.log("showMore");
    $showMore = true;
  };
</script>

{#if maxHeight !== 0}
  <Truncate {maxHeight} {onClickShowMore} {depth}>
    <ContentParts
      {maxHeight}
      {text}
      {tags}
      {isShowClientTag}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    />
  </Truncate>
{:else}
  <ContentParts
    {maxHeight}
    {text}
    {tags}
    {isShowClientTag}
    {displayMenu}
    {depth}
    {repostable}
    {tieKey}
  />
{/if}
<!--Show more no Dialog-->

<Dialog bind:open={showMore} zIndex={zIndex + 10}>
  {#snippet main()}
    <div class=" rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden">
      <ContentParts
        {maxHeight}
        {text}
        {tags}
        {isShowClientTag}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />
    </div>
  {/snippet}</Dialog
>
