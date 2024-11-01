<script lang="ts">
  import { Reply, Minimize2 } from "lucide-svelte";
  import Note from "./Note.svelte";
  import NaddrEvent from "./NaddrEvent.svelte";
  import { parseNaddr } from "$lib/func/util";
  import { _ } from "svelte-i18n";

  export let replyTag: string[] | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;
  let loadNote = false;
</script>

{#if replyTag}
  {#if !loadNote}
    <button
      class="my-1 flex items-center w-fit px-1 py-0.5 max-w-full font-bold rounded-md text-sm bg-magnum-700 text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
      on:click={() => (loadNote = true)}
      ><Reply size="20" />{$_("timeline.viewParentPost")}</button
    >
  {:else}
    <button
      class="my-1 flex items-center w-fit px-1 py-0.5 rounded-md bg-magnum-200 text-sm font-bold text-magnum-700 hover:opacity-75 active:opacity-50 overflow-hidden max-w-full h-fit"
      on:click={() => (loadNote = false)}
      ><Minimize2 size="20" class="mr-1" />{$_(
        "timeline.hideParentPost"
      )}</button
    >
    <div class="border rounded-md border-magnum-600/30">
      {#if replyTag[0] === "e"}
        <Note
          id={replyTag[1]}
          mini={true}
          {displayMenu}
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
          depth={depth + 1}
          {tieKey}
          {repostable}
          content={undefined}
        />
      {/if}
    </div>
  {/if}
{/if}
