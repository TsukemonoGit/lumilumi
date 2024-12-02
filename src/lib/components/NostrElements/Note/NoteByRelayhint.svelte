<script lang="ts">
  import { nip19 } from "nostr-tools";
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import Text from "$lib/components/NostrMainData/Text.svelte";
  import EllipsisMenuNote from "./NoteActionButtuns/EllipsisMenuNote.svelte";
  import { encodetoNote } from "$lib/func/encode";
  import { queryClient } from "$lib/stores/stores";

  interface Props {
    id: string;
    mini?: boolean;
    maxHeight?: string;
    displayMenu: boolean;
    thread?: boolean;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    relayhint: string[];
  }

  let {
    id,
    mini = false,
    maxHeight = "24rem",
    displayMenu,
    thread = false,
    depth,
    repostable,
    tieKey,
    relayhint,
  }: Props = $props();
  let loadingText = $derived(encodetoNote(id));
  const queryCheck = async (id: string) => {
    //if (!$queryClient.getQueryData(["timeline", id])) {//見つかんないときにリレーヒントから探すからない
    $queryClient.removeQueries({ queryKey: ["timeline", id] });
    return;
    //  }
  };
</script>

{#await queryCheck(id)}
  <div
    class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
  >
    Loading {loadingText}{#if displayMenu}<EllipsisMenuNote
        notestr={loadingText}
      />{/if}
  </div>
{:then}
  <Text queryKey={["timeline", id]} {id} relays={relayhint}>
    {#snippet loading()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        Loading {loadingText}{#if displayMenu}<EllipsisMenuNote
            notestr={loadingText}
          />{/if}
      </div>
    {/snippet}
    {#snippet nodata()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        nodata {loadingText}{#if displayMenu}<EllipsisMenuNote
            notestr={loadingText}
          />{/if}
      </div>
    {/snippet}
    {#snippet error()}
      <div
        class="text-sm text-neutral-500 flex-inline break-all flex align-middle justify-between"
      >
        {nip19.noteEncode(id)}{#if displayMenu}<EllipsisMenuNote
            notestr={nip19.noteEncode(id)}
          />{/if}
      </div>
    {/snippet}
    {#snippet content({ data: text, status })}
      {text}
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
{/await}
