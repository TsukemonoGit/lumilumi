<script lang="ts">
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import * as Nostr from "nostr-typedef";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import NoteTemplate from "../NoteTemplate.svelte";

  export let note: Nostr.Event;
  export let depth: number;
  export let repostable: boolean;
  export let maxHeight: string;
  export let displayMenu: boolean;
  export let tieKey: string | undefined;
  export let mini;
  export let message: string | undefined = undefined;
  // console.log(message);
</script>

<Metadata
  queryKey={["metadata", note.pubkey]}
  pubkey={note.pubkey}
  let:metadata
>
  <div slot="loading">
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
  <div slot="nodata">
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
  <div slot="error">
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

  <NoteTemplate {note} {metadata} {mini} {displayMenu} {depth} {tieKey}
    ><span class="text-magnum-200 italic whitespace-pre-wrap break-words"
      >{message ?? `Invalid kind:${note.kind} Event`}</span
    >
    <div class="w-fit ml-auto">
      <NoteActionButtons {note} {repostable} {tieKey} />
    </div></NoteTemplate
  >
</Metadata>
