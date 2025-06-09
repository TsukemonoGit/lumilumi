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
  interface Props {
    event: Nostr.Event;
    depth: number;
  }

  let { event, depth }: Props = $props();

  const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];
  const title = event.tags.find((tag) => tag[0] === "title")?.[1];
  const description = event.tags.find((tag) => tag[0] === "description")?.[1];
  const image = event.tags.find((tag) => tag[0] === "image")?.[1];
  const size = 80;

  const naddr: nip19.AddressPointer = {
    identifier: dtag ?? "",
    kind: event.kind,
    pubkey: event.pubkey,
  };

  const handleClickToList = (event: Nostr.Event) => {
    // const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];

    goto(`/list/${nip19.naddrEncode(naddr)}`);
  };
</script>

<div class="w-full grid grid-cols-[1fr_auto] gap-1">
  <button
    title={`/list/${nip19.naddrEncode(naddr)}`}
    class="grid grid-cols-[auto_1fr] hover:opacity-75 active:opacity-50"
    onclick={() => handleClickToList(event)}
  >
    <div class="relative">
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
      <div
        class="absolute text-xs bottom-0 left-0 align-bottom text-magnum-900 dark:text-magnum-100 font-semibold bg-black/40 px-0.5"
      >
        kind:{event.kind}
      </div>
    </div>
    <div class="text-left h-full">
      <div class="text-sm font-bold text-magnum-400">
        {dtag}
      </div>
      <div class="text-mg font-bold text-magnum-400">
        {title ?? dtag}
      </div>
      <div class=" text-sm text-magnum-100">
        {description ?? ""}
      </div>
    </div>
  </button>

  <div class="flex flex-col justify-between items-center">
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
    <button class="text-magnum-400"
      ><ListEllipsisMenu
        note={event}
        listData={{ dtag: dtag, title: title, description: description }}
      />
    </button>
  </div>
</div>
