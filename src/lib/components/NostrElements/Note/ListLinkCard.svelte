<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { showImg } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import Avatar from "svelte-boring-avatars";
  import ListEllipsisMenu from "./ListEllipsisMenu.svelte";
  import { nip19 } from "nostr-tools";
  import { goto } from "$app/navigation";
  export let event: Nostr.Event;
  export let depth: number;
  export let tieKey: string | undefined;

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
    on:click={() => handleClickToList(event)}
  >
    <div class="relative">
      {#if $showImg && image}
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
    <Metadata
      queryKey={["metadata", event.pubkey]}
      pubkey={event.pubkey}
      let:metadata
    >
      <UserMenu
        slot="loading"
        pubkey={event.pubkey}
        metadata={undefined}
        size={40}
        {depth}
        {tieKey}
      />
      <UserMenu
        slot="nodata"
        pubkey={event.pubkey}
        metadata={undefined}
        size={40}
        {depth}
        {tieKey}
      />
      <UserMenu
        slot="error"
        pubkey={event.pubkey}
        metadata={undefined}
        size={40}
        {depth}
        {tieKey}
      />
      <UserMenu
        pubkey={event.pubkey}
        {metadata}
        size={40}
        {depth}
        {tieKey}
      /></Metadata
    >
    <button class="text-magnum-400"
      ><ListEllipsisMenu
        note={event}
        listData={{ dtag: dtag, title: title, description: description }}
        {tieKey}
      />
    </button>
  </div>
</div>
