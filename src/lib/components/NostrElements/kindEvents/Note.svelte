<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import { encodetoNote } from "$lib/func/encode";
  import NoteByRelayhint from "./NoteByRelayhint.svelte";
  import EmptyCard from "./EventCard/EmptyCard.svelte";

  interface Props {
    id: string;
    mini?: boolean;
    maxHeight?: number;
    displayMenu: boolean;
    thread?: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    relayhint?: string[] | undefined;
  }

  let {
    id,
    mini = false,
    maxHeight,
    displayMenu,
    thread = false,
    depth,
    repostable,
    tieKey,
    relayhint = undefined,
  }: Props = $props();
  let loadingText = $derived(encodetoNote(id));
</script>

<Text queryKey={["timeline", id]} {id}>
  {#snippet loading()}
    <EmptyCard nevent={displayMenu ? loadingText : undefined}
      >Loading {loadingText}</EmptyCard
    >{/snippet}
  {#snippet nodata()}
    <div>
      {#if relayhint && relayhint.length > 0}
        <NoteByRelayhint
          {id}
          {mini}
          {displayMenu}
          {depth}
          {repostable}
          {tieKey}
          {relayhint}
        />
      {:else}<EmptyCard nevent={displayMenu ? loadingText : undefined}
          >nodata {loadingText}</EmptyCard
        >{/if}
    </div>
  {/snippet}
  {#snippet error()}
    <EmptyCard nevent={displayMenu ? loadingText : undefined}
      >nodata {loadingText}</EmptyCard
    >
  {/snippet}
  {#snippet content({ data: text, status })}
    <Metadata queryKey={["metadata", text.pubkey]} pubkey={text.pubkey}>
      {#snippet loading()}
        <div>
          <EventCard
            note={text}
            {mini}
            {maxHeight}
            {thread}
            {depth}
            {repostable}
            {tieKey}
          />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div>
          <EventCard
            note={text}
            {mini}
            {maxHeight}
            {thread}
            {depth}
            {repostable}
            {tieKey}
          />
        </div>
      {/snippet}
      {#snippet error()}
        <div>
          <EventCard
            note={text}
            {mini}
            {maxHeight}
            {thread}
            {depth}
            {repostable}
            {tieKey}
          />
        </div>
      {/snippet}
      {#snippet content({ metadata })}
        <EventCard
          note={text}
          {metadata}
          {mini}
          {maxHeight}
          {thread}
          {displayMenu}
          {depth}
          {repostable}
          {tieKey}
        />
      {/snippet}
    </Metadata>
  {/snippet}
</Text>
