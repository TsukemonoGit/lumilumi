<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { ChannelData } from "$lib/types";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";
  import { showImg } from "$lib/stores/stores";
  import Avatar from "svelte-boring-avatars";
  import UserAvatar from "$lib/components/Elements/UserAvatar.svelte";
  import { splitHexColorString } from "$lib/func/util";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import EllipsisMenu from "./NoteActionButtuns/EllipsisMenu.svelte";

  export let id: string; //40
  export let handleClickToChannel: (() => void) | undefined = undefined;
  let size = 96;
  export let event: Nostr.Event; //40か41
  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(event.content) as ChannelData;
    } catch (error) {
      return undefined;
    }
  };
  const channelData = getContent(event);
</script>

{#if channelData}
  <div class="grid grid-cols-[auto_1fr_auto]">
    <!--がぞう-->
    <button on:click={handleClickToChannel}>
      {#if $showImg && channelData.picture}
        <UserAvatar
          url={channelData.picture}
          name={id}
          pubkey={id}
          {size}
          square={true}
        />
      {:else}
        <Avatar
          {size}
          name={id}
          variant="beam"
          colors={splitHexColorString(id)}
          square={true}
        />
      {/if}
    </button>
    <!--てきすとたち-->
    <button
      class="ml-2 hover:opacity-75 focus:opacity-50 text-start flex flex-col"
      on:click={handleClickToChannel}
    >
      <div class="text-xl font-bold text-magnum-400">
        {channelData.name}
      </div>

      <div class="text-magnum-100">{channelData.about}</div>
    </button>
    <Metadata
      queryKey={["metadata", event.pubkey]}
      pubkey={event.pubkey}
      let:metadata
    >
      <UserMenu
        slot="loading"
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
      />

      <UserMenu
        slot="error"
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
      />

      <UserMenu
        slot="nodata"
        pubkey={event.pubkey}
        metadata={undefined}
        size={24}
      />

      <div class="flex flex-col justify-between items-center">
        <UserMenu pubkey={event.pubkey} {metadata} size={40} />
        <button class="text-magnum-400"
          ><EllipsisMenu note={event} indexes={[3, 0, 1]} /></button
        >
      </div>
    </Metadata>
  </div>
{/if}
