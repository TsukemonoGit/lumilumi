<script lang="ts">
  import { Reply, Minimize2 } from "lucide-svelte";
  import Note from "./Note.svelte";
  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";
  import UserName from "./UserName.svelte";

  export let replyID: string | undefined;
  export let replyUsers: string[];
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  let loadNote = false;
</script>

{#if replyUsers.length > 0}
  <div
    class="my-1 text-sm text-magnum-100 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-24 overflow-y-auto"
  >
    {#each replyUsers as user}
      {#if !displayMenu}<UserName pubhex={user} />{:else}
        <PopupUserName pubkey={user} metadata={undefined} />{/if}
    {/each}
  </div>
{/if}
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
      />
    </div>
  {/if}
{/if}
