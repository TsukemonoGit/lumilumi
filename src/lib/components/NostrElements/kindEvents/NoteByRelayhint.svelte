<script lang="ts">
  import EventCard from "./EventCard/EventCard.svelte";
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import { encodetoNote } from "$lib/func/encode";
  import { loginUser, queryClient } from "$lib/stores/stores";
  import EmptyCard from "./EventCard/EmptyCard.svelte";
  import * as Nostr from "nostr-typedef";

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
    omit: boolean;
    isOmitted?: boolean;
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
    omit,
    isOmitted = $bindable(),
  }: Props = $props();
  let loadingText = $derived(encodetoNote(id));
  const queryCheck = async (id: string) => {
    //if (!queryClient.getQueryData(["timeline", id])) {//見つかんないときにリレーヒントから探すからない
    queryClient.removeQueries({ queryKey: ["timeline", id] });
    return;
    //  }
  };

  const onChange = (ev: Nostr.Event) => {
    isOmitted = omit && ev.pubkey === $loginUser;
  };
</script>

{#await queryCheck(id)}<EmptyCard nevent={displayMenu ? loadingText : undefined}
    >Loading {loadingText}</EmptyCard
  >
{:then}
  <Text queryKey={["timeline", id]} {id} relays={relayhint} {onChange}>
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
              mini={isOmitted || mini}
              showStatus={isOmitted}
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
              mini={isOmitted || mini}
              showStatus={isOmitted}
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
              mini={isOmitted || mini}
              showStatus={isOmitted}
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
            mini={isOmitted || mini}
            showStatus={isOmitted}
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
