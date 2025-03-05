<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import { encodetoNote } from "$lib/func/encode";
  import { queryClient } from "$lib/stores/stores";
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
    relayhint: string[];
    zIndex?: number;
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
    relayhint,
    zIndex,
  }: Props = $props();
  let loadingText = $derived(encodetoNote(id));
  const queryCheck = async (id: string) => {
    //if (!queryClient.getQueryData(["timeline", id])) {//見つかんないときにリレーヒントから探すからない
    queryClient.removeQueries({ queryKey: ["timeline", id] });
    return;
    //  }
  };
</script>

{#await queryCheck(id)}<EmptyCard nevent={displayMenu ? loadingText : undefined}
    >Loading {loadingText}</EmptyCard
  >
{:then}
  <Text queryKey={["timeline", id]} {id} relays={relayhint}>
    {#snippet loading()}
      <EmptyCard nevent={displayMenu ? loadingText : undefined}
        >Loading {loadingText}</EmptyCard
      >
    {/snippet}
    {#snippet nodata()}
      <EmptyCard nevent={displayMenu ? loadingText : undefined}
        >Nodata {loadingText}</EmptyCard
      >
    {/snippet}
    {#snippet error()}
      <EmptyCard nevent={displayMenu ? loadingText : undefined}
        >Nodata {loadingText}</EmptyCard
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
              {zIndex}
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
              {zIndex}
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
              {zIndex}
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
            {zIndex}
          />
        {/snippet}
      </Metadata>
    {/snippet}
  </Text>
{/await}
