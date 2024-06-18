<script lang="ts">
  import { Reply } from "lucide-svelte";
  import UserName from "./UserName.svelte";
  import Note from "./Note.svelte";

  export let replyID: string | undefined;
  export let replyUsers: string[];

  let loadNote = false;
</script>

<div>
  {#if replyUsers.length > 0}
    <div class="text-sm text-neutral-500 flex break-all flex-wrap">
      {#each replyUsers as user}
        <UserName pubhex={user} />
      {/each}
    </div>
  {/if}
  {#if replyID}
    {#if !loadNote}
      <button
        class="flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        on:click={() => (loadNote = true)}><Reply size="20" />replied</button
      >
    {:else}
      <Note id={replyID} mini={true} />
    {/if}
  {/if}
</div>
