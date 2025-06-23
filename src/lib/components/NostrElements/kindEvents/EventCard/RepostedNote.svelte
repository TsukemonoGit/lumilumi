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

    mini: boolean;
  }

  let {
    displayMenu,
    repostable,
    maxHeight,
    tag,
    depth,

    zIndex,
    mini,
  }: Props = $props();
</script>

{#if tag[0] === "e"}
  <Note
    relayhint={tag[2] ? [tag[2]] : undefined}
    id={tag[1]}
    {mini}
    {displayMenu}
    {depth}
    {repostable}
    {maxHeight}
    {zIndex}
    omit={page.route.id === "/notifications" && depth === 1}
  />
{:else if tag[0] === "a"}
  <NaddrEvent
    data={parseNaddr(tag)}
    {displayMenu}
    {depth}
    {repostable}
    content={tag[1]}
    {zIndex}
    omit={page.route.id === "/notifications" && depth === 1}
    mini={true}
  />
{:else}
  {tag}
{/if}
