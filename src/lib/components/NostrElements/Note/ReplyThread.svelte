<script lang="ts">
  import Note from "./Note.svelte";

  export let replyID: string | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
</script>

{#if replyID}
  <Note
    id={replyID}
    mini={true}
    {displayMenu}
    thread={true}
    depth={depth + 1}
    {repostable}
    {tieKey}
  />
{/if}
