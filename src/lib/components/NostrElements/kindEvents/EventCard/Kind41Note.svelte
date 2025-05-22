<script lang="ts">
  import { getRelaysById } from "$lib/func/nostr";
  import { nip19 } from "nostr-tools";
  import ChannelMetadataLayout from "../ChannelMetadataLayout.svelte";
  import OtherKindNote from "./OtherKindNote.svelte";
  import * as Nostr from "nostr-typedef";
  import { goto } from "$app/navigation";
  interface Props {
    replyUsers: string[];

    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    repostable: boolean;
    tieKey: string | undefined;
    mini: boolean;
    zIndex?: number;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    repostable,
    tieKey,
    mini,
    zIndex,
  }: Props = $props();

  let root = note.tags.find((tag) => tag[0] === "e")?.[1];

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

<!--kind40 パブ茶部屋-->
{#if root}
  <ChannelMetadataLayout
    clickAction={true}
    linkButtonTitle={`/channel/${nip19.noteEncode(root)}`}
    handleClickToChannel={() => handleClickToChannel(root)}
    id={root}
    event={note}
    {tieKey}
  />
{:else}
  <OtherKindNote
    {tieKey}
    {note}
    {metadata}
    {displayMenu}
    {depth}
    {maxHeight}
    {zIndex}
    {mini}
    {repostable}
  />
{/if}
