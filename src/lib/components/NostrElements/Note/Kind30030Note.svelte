<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  export let note: Nostr.Event;

  $: dtag = note?.tags?.find((tag) => tag[0] === "d")?.[1];
  $: title = note?.tags?.find((tag) => tag[0] === "title")?.[1];
</script>

<div class="flex flex-col w-full">
  <div class="flex flex-row justify-between">
    <div>kind:30030</div>
    <div>
      <span class="text-sm">{dtag}</span>
      <span class="text-magnum-400 font-bold">{title}</span>
    </div>
  </div>
  <div class="flex gap-1 flex-wrap">
    {#each note.tags.filter((tag) => tag[0] === "emoji") as [tag, shortcode, url]}
      {#if $showImg}
        <img
          loading="lazy"
          alt={shortcode}
          src={url}
          class="inline h-[24px] object-contain m-0 overflow-hidden"
        />
      {:else}
        <div>{shortcode}</div>
      {/if}
    {/each}
  </div>
  <NoteActionButtons {note} />
</div>
