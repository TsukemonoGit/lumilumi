<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import * as Nostr from "nostr-typedef";
  import Avatar from "svelte-boring-avatars";
  import ListEllipsisMenu from "../ListEllipsisMenu.svelte";
  import { nip19 } from "nostr-tools";
  import { goto } from "$app/navigation";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  interface Props {
    event: Nostr.Event;
    depth: number;
    tieKey: string | undefined;
  }

  let { event, depth, tieKey }: Props = $props();

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
        <UserMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={40}
          {depth}
          {tieKey}
        />
      {/snippet}
      {#snippet nodata()}
        <UserMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={40}
          {depth}
          {tieKey}
        />
      {/snippet}
      {#snippet error()}
        <UserMenu
          pubkey={event.pubkey}
          metadata={undefined}
          size={40}
          {depth}
          {tieKey}
        />
      {/snippet}
      {#snippet content({ metadata })}
        <UserMenu pubkey={event.pubkey} {metadata} size={40} {depth} {tieKey} />
      {/snippet}
    </Metadata>
    <button class="text-magnum-400"
      ><ListEllipsisMenu
        note={event}
        listData={{ dtag: dtag, title: title, description: description }}
        {tieKey}
      />
    </button>
  </div>
</div>
