<script lang="ts">
  import { Reply, Minimize2 } from "lucide-svelte";
  import Note from "./Note.svelte";

  export let replyID: string | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
  let loadNote = false;
</script>

{#if replyID}
  {#if !loadNote}
    <button
      class="my-1 flex items-center w-fit px-2 max-w-full rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
      on:click={() => (loadNote = true)}><Reply size="20" />replied</button
    >
  {:else}
    <button
      class="my-1 flex items-center w-fit px-2 rounded-md bg-magnum-100 font-medium text-magnum-600 hover:opacity-75 active:opacity-50 overflow-hidden max-w-full h-fit"
      on:click={() => (loadNote = false)}
      ><Minimize2 size="20" class="mr-1" /> hide</button
    >
    <div class="border rounded-md border-magnum-600/30">
      <Note
        id={replyID}
        mini={true}
        {displayMenu}
        depth={depth + 1}
        {repostable}
        {tieKey}
      />
    </div>
  {/if}
{/if}
