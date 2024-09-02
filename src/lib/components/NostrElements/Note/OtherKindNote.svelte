<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Content from "./Content.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import { eventKinds, profile } from "$lib/func/util";
  import { showImg } from "$lib/stores/stores";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import Markdown from "./Markdown.svelte";
  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let maxHeight: string;
  export let repostable: boolean;
  $: title =
    note.tags.find((tag) => tag[0] === "title" && tag.length > 1)?.[1] ??
    note.tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1];
  $: description = note.tags.find(
    (tag) =>
      (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
  )?.[1];
  $: image = note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1];
</script>

<div class=" break-all overflow-x-hidden gap-4 p-1">
  <div class="flex gap-1 w-fit">
    {#if metadata}
      <div>
        <UserMenu
          pubkey={note.pubkey}
          bind:metadata
          size={20}
          {displayMenu}
          {depth}
        />
      </div>
      <div class="text-magnum-100 text-sm">
        @{profile(metadata)?.name}
      </div>
      <div class="text-neutral-300/50 text-sm">
        {eventKinds.get(note.kind)?.en ?? `kind:${note.kind}`}
      </div>
    {/if}
  </div>
  <div class="grid grid-cols-[1fr_auto] w-full gap-1">
    <div>
      {#if title}
        <div class="text-lg font-bold text-magnum-400">
          {title}
        </div>{/if}
      {#if description}
        <div class=" text-neutral-300/80">{description}</div>{/if}
    </div>
    {#if image && $showImg}
      <img src={image} alt="" class="max-w-16 object-contain max-h-16" />{/if}
  </div>
  <div
    class="mt-0.5 overflow-y-auto overflow-x-hidden"
    style="max-height:{maxHeight ?? 'none'}"
  >
    {#if note.kind === 30023}
      <Markdown
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
      />{:else}
      <Content
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
      />{/if}
  </div>
  {#if displayMenu}<NoteActionButtons {note} {repostable} />{/if}
</div>
