<script lang="ts">
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { showImg } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";
  import Avatar from "svelte-boring-avatars";
  export let event: Nostr.Event;

  const dtag = event.tags.find((tag) => tag[0] === "d")?.[1];
  const title = event.tags.find((tag) => tag[0] === "title")?.[1];
  const description = event.tags.find((tag) => tag[0] === "description")?.[1];
  const image = event.tags.find((tag) => tag[0] === "image")?.[1];
  const size = 80;
</script>

<div class="grid grid-cols-[auto_1fr] gap-1">
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
</div>
