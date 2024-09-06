<script lang="ts">
  import { showImg } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  export let note: Nostr.Event;
  export let repostable: boolean;
  export let maxHeight: string;
  $: dtag = note?.tags?.find((tag) => tag[0] === "d")?.[1];
  $: title = note?.tags?.find((tag) => tag[0] === "title")?.[1];
  $: description = note.tags.find(
    (tag) =>
      (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
  )?.[1];
  $: image = note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1];
</script>

<div class="flex flex-col w-full">
  <div class="grid grid-cols-[1fr_auto] w-full gap-1">
    <div>
      Emoji set: <span class="text-lg font-bold text-magnum-400"
        >{title ?? dtag}</span
      >{#if description}
        <div class=" text-neutral-300/80">{description}</div>{/if}
    </div>
    {#if image && $showImg}
      <img src={image} alt="" class="max-w-16 object-contain max-h-16" />{/if}
  </div>
  <div class="flex gap-1 flex-wrap" style="max-height:{maxHeight ?? 'none'}">
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
  <NoteActionButtons {note} {repostable} />
</div>
