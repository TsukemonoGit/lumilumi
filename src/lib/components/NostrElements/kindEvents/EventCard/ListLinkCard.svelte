<script lang="ts">
  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import * as Nostr from "nostr-typedef";
  import Avatar from "svelte-boring-avatars";
  import ListEllipsisMenu from "../ListEllipsisMenu.svelte";
  import * as nip19 from "nostr-tools/nip19";
  import { goto } from "$app/navigation";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserAvatar from "../../user/UserAvatar.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import ListCardComponent from "../layout/ListCardComponent.svelte";
  interface Props {
    event: Nostr.Event;
    depth: number;
  }

  let { event, depth }: Props = $props();

  let dtag = $derived(event.tags.find((tag) => tag[0] === "d")?.[1]);
  let title = $derived(event.tags.find((tag) => tag[0] === "title")?.[1]);
  let description = $derived(
    event.tags.find((tag) => tag[0] === "description")?.[1]
  );
  let image = $derived(event.tags.find((tag) => tag[0] === "image")?.[1]);
  const size = 80;

  let naddr: nip19.AddressPointer = $derived({
    identifier: dtag ?? "",
    kind: event.kind,
    pubkey: event.pubkey,
  });

  const handleClickToList = (event: Nostr.Event) => {
    // const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];

    goto(`/list/${nip19.naddrEncode(naddr)}`);
  };
</script>

<ListCardComponent
  clickAction={true}
  listProps={{
    kind: event.kind,
    name: title ?? dtag ?? "",
    about: description ?? "",
  }}
  linkButtonTitle={`/list/${nip19.naddrEncode(naddr)}`}
  handleClickToChannel={() => handleClickToList(event)}
>
  {#snippet listAvatar()}
    {#if lumiSetting.get().showImg && image}
      <UserAvatar
        url={image}
        name={dtag}
        pubkey={event.pubkey}
        {size}
        square={true}
      />
    {:else}
      <Avatar {size} name={dtag} variant="beam" square={true} />
    {/if}
  {/snippet}
  {#snippet userAvatar()}
    <Metadata queryKey={["metadata", event.pubkey]} pubkey={event.pubkey}>
      {#snippet loading()}
        <UserPopupMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={40}
          {depth}
        />
      {/snippet}
      {#snippet nodata()}
        <UserPopupMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={40}
          {depth}
        />
      {/snippet}
      {#snippet error()}
        <UserPopupMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={40}
          {depth}
        />
      {/snippet}
      {#snippet content({ metadata })}
        <UserPopupMenu pubkey={event.pubkey} {metadata} size={40} {depth} />
      {/snippet}
    </Metadata>
  {/snippet}
  {#snippet menu()}
    <ListEllipsisMenu
      note={event}
      listData={{ dtag: dtag, title: title, description: description }}
    />{/snippet}
</ListCardComponent>
