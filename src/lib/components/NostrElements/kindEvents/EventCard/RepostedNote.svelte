<script lang="ts">
  import { parseNaddr } from "$lib/func/util";

  import Note from "../Note.svelte";
  import NaddrEvent from "../NaddrEvent.svelte";
  import { page } from "$app/state";

  interface Props {
    displayMenu: boolean;
    repostable: boolean;
    maxHeight: number | undefined;
    //tagはaかe
    tag: string[];
    zIndex?: number;
    depth: number;
    tieKey: string | undefined;
    mini: boolean;
  }

  let {
    displayMenu,
    repostable,
    maxHeight,
    tag,
    depth,
    tieKey,
    zIndex,
    mini,
  }: Props = $props();
</script>

{#if tag[0] === "e"}
  <Note
    id={tag[1]}
    {mini}
    {displayMenu}
    {depth}
    {repostable}
    {tieKey}
    {maxHeight}
    {zIndex}
    omit={page.route.id === "/notifications" && depth === 1}
  />
{:else if tag[0] === "a"}
  <NaddrEvent
    data={parseNaddr(tag)}
    {displayMenu}
    {depth}
    {tieKey}
    {repostable}
    content={tag[1]}
    {zIndex}
    mini={true}
  />
{:else}
  {tag}
{/if}
