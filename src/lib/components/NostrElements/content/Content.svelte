<script lang="ts">
  import { t as _ } from "@konemono/svelte5-i18n";

  import Truncate from "./Truncate.svelte";
  import ContentParts from "./ContentParts.svelte";
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
  <Truncate
    useDialog={true}
    {maxHeight}
    {depth}
    {zIndex}
    dialogId={`showMore_${text.slice(5)}_${depth}`}
  >
    {@render contentDisplay()}
    {#snippet dialogContent()}
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
    {/snippet}
  </Truncate>
{:else}
  {@render contentDisplay()}
{/if}
