<script lang="ts">
  import { Reply, Minimize2 } from "lucide-svelte";
  import UserName from "./UserName.svelte";
  import Note from "./Note.svelte";
  import UserProfile from "$lib/components/NostrMainData/UserProfile.svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";
  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";

  export let replyID: string | undefined;
  export let replyUsers: string[];

  let loadNote = false;
</script>

{#if replyUsers.length > 0}
  <div
    class="text-sm text-magnum-100 flex break-all flex-wrap overflow-x-hidden gap-1"
  >
    {#each replyUsers as user}
      <PopupUserName pubkey={user} metadata={undefined} />
    {/each}
  </div>
{/if}
{#if replyID}
  {#if !loadNote}
    <button
      class="my-1 flex items-center w-fit px-2 max-w-full rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 overflow-x-hidden"
      on:click={() => (loadNote = true)}><Reply size="20" />replied</button
    >
  {:else}
    <button
      class="my-1 flex items-center w-fit px-2 rounded-md bg-magnum-100 font-medium text-magnum-600 hover:opacity-75 active:opacity-50 overflow-x-hidden max-w-full"
      on:click={() => (loadNote = false)}
      ><Minimize2 size="20" class="mr-1" /> hide</button
    >
    <Note id={replyID} mini={true} />
    <!-- <button
        class=" ml-auto my-1 flex items-center w-fit px-2 rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
        on:click={() => (loadNote = false)}><Minimize2 size="20" />hide</button
      > -->
  {/if}
{/if}
