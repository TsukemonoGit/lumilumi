<script lang="ts">
  import { parseNaddr } from "$lib/func/util";
  import NaddrEvent from "./NaddrEvent.svelte";
  import Note from "./Note.svelte";

  export let replyTag: string[] | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
</script>

{#if replyTag}
  {#if replyTag[0] === "e"}
    <Note
      id={replyTag[1]}
      mini={true}
      {displayMenu}
      thread={true}
      depth={depth + 1}
      {repostable}
      {tieKey}
    />
  {:else}
    <!---->
    {@const naddr = parseNaddr(replyTag)}
    <NaddrEvent
      data={naddr}
      {displayMenu}
      {depth}
      {tieKey}
      {repostable}
      content={undefined}
      mini={true}
      thread={true}
    />
  {/if}
{/if}
