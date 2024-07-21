<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { showImg } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import Avatar from "svelte-boring-avatars";
  import ListEllipsisMenu from "./ListEllipsisMenu.svelte";
  export let event: Nostr.Event;

  const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];
  const title = event.tags.find((tag) => tag[0] === "title")?.[1];
  const description = event.tags.find((tag) => tag[0] === "description")?.[1];
  const image = event.tags.find((tag) => tag[0] === "image")?.[1];
  const size = 80;
</script>

<div class="w-full grid grid-cols-[auto_1fr_auto] gap-1">
  <div>
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
  </div>
  <div class=" text-left">
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
      />
      <UserMenu
        slot="nodata"
        pubkey={event.pubkey}
        metadata={undefined}
        size={40}
      />
      <UserMenu
        slot="error"
        pubkey={event.pubkey}
        metadata={undefined}
        size={40}
      />
      <UserMenu pubkey={event.pubkey} {metadata} size={40} /></Metadata
    >
    <button class="text-magnum-400"><ListEllipsisMenu note={event} /></button>
  </div>
</div>
