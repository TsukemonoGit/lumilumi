<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import Truncate from "./Truncate.svelte";
  import ContentParts from "./ContentParts.svelte";
  import Dialog from "$lib/components/Elements/Dialog.svelte";
  import { writable, type Writable } from "svelte/store";
  import * as Nostr from "nostr-typedef";
  interface Props {
    event: Partial<Nostr.Event>;
    displayMenu: boolean;
    depth: number;
    repostable: boolean;

    isShowClientTag?: boolean;
    maxHeight?: number | undefined;
    zIndex?: number | undefined;
    displayTags?: boolean;
    kind?: number;
  }

  let {
    event,
    displayMenu,
    depth,
    repostable,

    isShowClientTag,
    maxHeight,
    zIndex = 0,
    displayTags,
  }: Props = $props();
  let text = $derived(event.content || "");

  // svelte-ignore non_reactive_update
  let showMore: Writable<boolean> = writable(false);

  const onClickShowMore = () => {
    console.log("showMore");

    $showMore = true;
  };
</script>

{#snippet contentDisplay()}
  <ContentParts
    {maxHeight}
    {event}
    {isShowClientTag}
    {displayMenu}
    {depth}
    {repostable}
    {zIndex}
    {displayTags}
  />
{/snippet}

{#if maxHeight !== 0}
  <Truncate {maxHeight} {onClickShowMore} {depth}>
    {@render contentDisplay()}
  </Truncate>
{:else}
  {@render contentDisplay()}
{/if}
<!--Show more no Dialog-->

<Dialog
  id={`showMore_${text.slice(5)}_${depth}`}
  bind:open={showMore}
  zIndex={zIndex + 10}
>
  {#snippet main()}
    <ContentParts
      {maxHeight}
      {event}
      {isShowClientTag}
      {displayMenu}
      {depth}
      {repostable}
      zIndex={zIndex + 10}
      {displayTags}
    />
  {/snippet}</Dialog
>
