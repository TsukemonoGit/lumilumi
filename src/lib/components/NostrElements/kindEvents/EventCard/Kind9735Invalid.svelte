<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import NoteTemplate from "../NoteTemplate.svelte";

  interface Props {
    note: Nostr.Event;
    depth: number;
    repostable: boolean;
    maxHeight: number;
    displayMenu: boolean;
    tieKey: string | undefined;
    mini: any;
    message?: string | undefined; // console.log(message);
  }

  let {
    note,
    depth,
    repostable,
    maxHeight,
    displayMenu,
    tieKey,
    mini,
    message = undefined,
  }: Props = $props();
</script>

<Metadata queryKey={["metadata", note.pubkey]} pubkey={note.pubkey}>
  {#snippet loading()}
    <div>
      <NoteTemplate
        {note}
        metadata={undefined}
        {mini}
        {displayMenu}
        {depth}
        {tieKey}
        ><span class="text-magnum-200 italic"
          >{message ?? `Invalid kind:${note.kind} Event`}</span
        >
        <div class="w-fit ml-auto">
          <NoteActionButtons {note} {repostable} {tieKey} />
        </div></NoteTemplate
      >
    </div>
  {/snippet}
  {#snippet nodata()}
    <div>
      <NoteTemplate
        {note}
        metadata={undefined}
        {mini}
        {displayMenu}
        {depth}
        {tieKey}
        ><span class="text-magnum-200 italic"
          >{message ?? `Invalid kind:${note.kind} Event`}</span
        >
        <div class="w-fit ml-auto">
          <NoteActionButtons {note} {repostable} {tieKey} />
        </div></NoteTemplate
      >
    </div>
  {/snippet}
  {#snippet error()}
    <div>
      <NoteTemplate
        {note}
        metadata={undefined}
        {mini}
        {displayMenu}
        {depth}
        {tieKey}
        ><span class="text-magnum-200 italic"
          >{message ?? `Invalid kind:${note.kind} Event`}</span
        >
        <div class="w-fit ml-auto">
          <NoteActionButtons {note} {repostable} {tieKey} />
        </div></NoteTemplate
      >
    </div>
  {/snippet}

  {#snippet content({ metadata })}
    <NoteTemplate {note} {metadata} {mini} {displayMenu} {depth} {tieKey}
      ><span class="text-magnum-200 italic whitespace-pre-wrap break-words"
        >{message ?? `Invalid kind:${note.kind} Event`}</span
      >
      <div class="w-fit ml-auto">
        <NoteActionButtons {note} {repostable} {tieKey} />
      </div></NoteTemplate
    >
  {/snippet}
</Metadata>
