<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import Truncate from "./Truncate.svelte";
  import ContentParts from "./ContentParts.svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import { writable, type Writable } from "svelte/store";
  import { untrack } from "svelte";

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
    displayTags?: boolean;
    kind?: number;
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
    displayTags,
    kind,
  }: Props = $props();

  // svelte-ignore non_reactive_update
  let showMore: Writable<boolean> = writable(false);
  let dialogContentRef: HTMLDivElement | undefined = $state();
  const onClickShowMore = () => {
    console.log("showMore");

    $showMore = true;
  };
  $effect(() => {
    if (dialogContentRef) {
      console.log("dialogContentRef", dialogContentRef);
      untrack(() => {
        setTimeout(() => {
          (dialogContentRef as HTMLDivElement).scrollTop = 0;
        }, 0);
      });
    }
  });
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
      {zIndex}
      {displayTags}
      {kind}
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
    {zIndex}
    {displayTags}
    {kind}
  />
{/if}
<!--Show more no Dialog-->

<Dialog
  id={`showMore_${text.slice(5)}_${depth}`}
  bind:open={showMore}
  zIndex={zIndex + 10}
>
  {#snippet main()}
    <div
      class=" rounded-md p-2 bg-zinc-800/40 w-full overflow-x-hidden"
      bind:this={dialogContentRef}
    >
      <ContentParts
        {maxHeight}
        {text}
        {tags}
        {isShowClientTag}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
        {zIndex}
        {displayTags}
        {kind}
      />
    </div>
  {/snippet}</Dialog
>
