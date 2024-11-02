<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Content from "../Content.svelte";
  import SimpleMarkdown from "$lib/components/MarkdownItem/SimpleMarkdown.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";

  export let repostable: boolean;
  export let displayMenu: boolean;

  //export let kind: number | undefined;
  export let depth: number;
  export let tieKey: string | undefined;
  export let maxHeight: string;

  export let text: Nostr.Event;
</script>

<div
  class="ml-6 my-1 text-sm opacity-80 overflow-y-auto overflow-x-hidden"
  style="max-height:{maxHeight ?? 'none'}"
>
  {#if text.kind === 30023 || text.kind === 30024}<SimpleMarkdown
      text={text.content ?? ""}
      tags={text.tags}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    />
  {:else}
    <Content
      text={text.content ?? ""}
      tags={text.tags}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    />
  {/if}
  {#if displayMenu}
    <NoteActionButtons note={text} {repostable} {tieKey} />{/if}
</div>
