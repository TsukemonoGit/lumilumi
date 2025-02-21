<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import { nip19 } from "nostr-tools";
  import ChannelMetadataLayout from "../ChannelMetadataLayout.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import { goto } from "$app/navigation";

  interface Props {
    note: Nostr.Event;

    tieKey: string | undefined;
  }

  let {
    note,

    tieKey,
  }: Props = $props();
  const handleClickToChannel = (id: string) => {
    if (!id) {
      return;
    }
    const neventPointer: nip19.EventPointer = {
      id: id,
      relays: tieKey ? getRelaysById(id, tieKey) : [],
    };
    goto(`/channel/${nip19.neventEncode(neventPointer)}`);
  };
</script>

<LatestEvent
  queryKey={["channel", "kind41", note.id]}
  filters={[{ kinds: [41], authors: [note.pubkey], limit: 1, "#e": [note.id] }]}
>
  {#snippet loading()}
    <div>
      <ChannelMetadataLayout
        linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
        handleClickToChannel={() => handleClickToChannel(note.id)}
        id={note.id}
        event={note}
        {tieKey}
      />
    </div>
  {/snippet}
  {#snippet nodata()}
    <div>
      <ChannelMetadataLayout
        linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
        handleClickToChannel={() => handleClickToChannel(note.id)}
        id={note.id}
        event={note}
        {tieKey}
      />
    </div>
  {/snippet}
  {#snippet error()}
    <div>
      <ChannelMetadataLayout
        linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
        handleClickToChannel={() => handleClickToChannel(note.id)}
        id={note.id}
        event={note}
        {tieKey}
      />
    </div>
  {/snippet}
  {#snippet children({ event })}
    <ChannelMetadataLayout
      linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
      handleClickToChannel={() => handleClickToChannel(note.id)}
      id={note.id}
      {event}
      {tieKey}
    />
  {/snippet}
</LatestEvent>
