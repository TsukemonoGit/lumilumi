<script lang="ts">
  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import * as nip19 from "nostr-tools/nip19";
  import ChannelMetadataLayout from "../ChannelMetadataLayout.svelte";
  import { getRelaysById } from "$lib/func/nostr";
  import * as Nostr from "nostr-typedef";
  import { goto } from "$app/navigation";

  interface Props {
    note: Nostr.Event;
  }

  const { note }: Props = $props();
  const handleClickToChannel = (id: string) => {
    if (!id) {
      return;
    }
    const neventPointer: nip19.EventPointer = {
      id: id,
      relays: getRelaysById(id),
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
        clickAction={true}
        linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
        handleClickToChannel={() => handleClickToChannel(note.id)}
        id={note.id}
        event={note}
      />
    </div>
  {/snippet}
  {#snippet nodata()}
    <div>
      <ChannelMetadataLayout
        clickAction={true}
        linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
        handleClickToChannel={() => handleClickToChannel(note.id)}
        id={note.id}
        event={note}
      />
    </div>
  {/snippet}
  {#snippet error()}
    <div>
      <ChannelMetadataLayout
        clickAction={true}
        linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
        handleClickToChannel={() => handleClickToChannel(note.id)}
        id={note.id}
        event={note}
      />
    </div>
  {/snippet}
  {#snippet children({ event })}
    <ChannelMetadataLayout
      clickAction={true}
      linkButtonTitle={`/channel/${nip19.noteEncode(note.id)}`}
      handleClickToChannel={() => handleClickToChannel(note.id)}
      id={note.id}
      {event}
    />
  {/snippet}
</LatestEvent>
